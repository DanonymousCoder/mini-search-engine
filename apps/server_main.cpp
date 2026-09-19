#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <string>
#include <thread>

#include "se/api.hpp"
#include "se/engine.hpp"
#include "se/http_server.hpp"
#include "se/sysinfo.hpp"

namespace {

std::atomic<bool> g_stop{false};
void on_signal(int) { g_stop = true; }

void usage() {
    std::cout << "Usage: se_server [options]\n"
               "  --data DIR        directory of .txt/.md documents to index\n"
               "  --index FILE      persisted index; loaded at startup if valid, written after every build\n"
               "  --rebuild         ignore an existing index file and rebuild from --data\n"
               "  --port N          listen port (default 8080; 0 = pick a free one)\n"
               "  --host ADDR       IPv4 bind address (default 127.0.0.1)\n"
               "  --workers N       indexing threads (default: hardware threads)\n"
               "  --http-threads N  request worker threads (default 8)\n"
               "  --cache N         LRU query cache entries (default 1024, 0 disables)\n"
               "  --help\n";
}

bool parse_size(const char* s, size_t& out) {
    char *end = nullptr;
    unsigned long long v = std::strtoull(s, &end, 10);
    if (end == s || *end != '\0') return false;
    out = static_cast<size_t>(v);
    return true;
}

}  // namespace

int main(int argc, char** argv) {
    std::string data_dir, index_path, host = "127.0.0.1";
    size_t port = 8080, workers = se::hardware_threads(), http_threads = 8, cache = 1024;
    bool rebuild = false;

    for (int i = 1; i < argc; ++i) {
        std::string a = argv[i];
        auto next  = [&](const char* name) -> const char* {
            if (i + 1 >= argc) {
                std::cerr << "missing value for " << name << "\n";
                std::exit(2);
            }
            return argv[++i];
        };
        auto num = [&](const char* name, size_t& out) {
            if (!parse_size(next(name), out)) {
                std::cerr << "invalid value for " << name << "\n";
                std::exit(2);
            }
        };
        if (a == "--data") data_dir = next("--data");
        else if (a == "--index") index_path = next("--index");
        else if (a == "--host") host = next("--host");
        else if (a == "--rebuild") rebuild = true;
        else if (a == "--port") num("--port", port);
        else if (a == "--workers") num("--workers", workers);
        else if (a == "--http-threads") num("--http-threads", http_threads);
        else if (a == "--cache") num("--cache", cache);
        else if (a == "--help" || a == "-h") { usage(); return 0; }
        else {
            std::cerr << "unknown option: " << a << "\n";
            usage();
            return 2;
        }
    }
    if (port > 65535 || workers == 0 || http_threads == 0) {
        std::cerr << "port must be <= 65535; workers and http-threads must be >= 1\n";
        return 2;
    }
    if (data_dir.empty() && index_path.empty()) {
        std::cerr << "need --data and/or --index\n";
        usage();
        return 2;
    }

    se::EngineConfig cfg;
    cfg.cache_capacity = cache;
    cfg.default_workers = workers;
    se::SearchEngine engine(cfg);

    bool loaded = false;
    if (!index_path.empty() && !rebuild && std::filesystem::exists(index_path)) {
        se::IoResult r = engine.load_index(index_path);
        if (r.ok) {
            auto st = engine.snapshot()->stats;
            std::cout <<  "loaded index " << index_path << ": " << st.documents << " docs, " << st.unique_terms << " terms in " << st.load_ms << " ms\n";
            loaded = true;
        } else {
            std::cerr << "could not use " << index_path << "(" << r.error << "); rebuilding\n";
        }
    }
    if (!loaded) {
        if (data_dir.empty()) {
            std::cerr << "no usable index and no --data directory to build from\n";
            return 1;
        }
        try {
            se::BuildStats b = engine.build_from_directory(data_dir, workers);
            std::count << "indexed " << b.documents << " docs (" << b.unique_terms << " terms, " << b.postings
            << " postings) in " << b.total_ms << " ms with " << b.workers << " workers = "
            << static_cast<long long>(b.docs_per_sec) << " docs/s\n";
            size_t skipped = b.skipped_empty + b.skipped_binary + b.skipped_too_large + b.skipped_unreadable;
            if(skipped) std::cout << "skipped" << "unusable files\n";
            if (b.documents == 0) std::cerr << "warning: no documents found under " << data_dir << "\n";
            if (!index_path.empty()) {
                se::IoResult r = engine.save_index(index_path);
                if (r.ok) std::cout << "saved index to " << index_path << "\n";
                else std::cerr << "warning: could not save index: " << r.error << "\n";
            }
        } catch (const std::exception& e) {
            std::cerr << "indexing failed: "<< e.what() << "\n";
            return 1;
        }
    }

    se::ApiHandler api (engine, se::ApiConfig{data_dir,index_path})
    se::HttpServer server(http_threads, http_threads * 64, [&api](const se::HttpRequest& r) { return api.handle(r); });
    api.set_http_stats_source([&server] { return server.stats(); })

    std::string err;
    if (!server.start(host, static_cast<uint16_t>(port), err)) {
        std::cerr << "cannot start server: " << err << "\n";
        return 1;
    }
}