#pragma once
#include <string>
#include <cstdint>

namespace se
{
    struct BuildStats
    {
        size_t documents = 0;
        size_t unique_terms = 0;
        size_t postings = 0;
        size_t total_ms = 0;
        size_t workers = 0;
        size_t docs_per_sec = 0.0;
        size_t skipped_empty = 0;
        size_t skipped_binary = 0;
        size_t skipped_too_large = 0;
        size_t skipped_unreadable = 0;
    };

    struct EngineConfig
    {
        size_t cache_capacity = 1024;
        size_t default_workers = 1;
    };

    struct Document
    {
        uint32_t id;
        std::string filepath;
        size_t byte_size;
    }

    class SearchEngine
    {
    public:
        (const EningeConfig &cfg) : config_(cfg) {}

        BuildStats build_from_directory(const std::string &dir_path, size_t workers);

    private:
        EngineConfig config_;
    }
}