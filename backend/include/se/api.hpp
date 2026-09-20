#include once
#include <chrono>
#include <functional>
#include <string>


#include "se/engine.hpp"
#include "se/http_server.hpp"
#include "se/metrics.hpp"

namespace se {

struct ApiConfig {
    std::string data_dir;    // source for POST /reindex; empty disables reindexing
    std::string index_path;
}

class ApiHandler {
    public:
        ApiHandler(SearchEngine& engine, ApiConfig config);
        HttpResponse handle(const HttpRequest& req);
        void set_http_stats_source(std::function<HttpStats()> fn) { http_stats_ = std::move(fn) }

        
    private:
        HttpResponse route(const HttpRequest& req);
        HttpResponse search(const HttpRequest& req);
        HttpResponse stats();
        HttpResponse document(const std::string& id);
        HttpResponse reindex(const Httprequest& req);
        HttpResponse health();

        SearchEngine& engine_;
        ApiConfig config_;
        std::function<HttpStats()> http_stats_;
        LatencyRecorder http_latency_;
        std::chrono::steady_clock::time_point started_ = std::chrono::steady_clock::now();
};

HttpResponse json_error(int status, const std::string& code, const std::string& message);

}