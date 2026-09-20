#pragma once
#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

#include "se/document.hpp"

namespace se {
    class Rng{
        public:
            explicit Rng(uint64_t seed) : state_(seed) {}
            uint64_t next() {
                uint64_t z = (state_ += 0x9E3779B97F4A7C15ULL);
                z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
                z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
                return z ^ (z >> 31);
            }
            double uniform() { return static_cast<double>(next() >> 11) * (1.0 / 9007199254740992.0); }
            uint64_t below(uint64_t n) { return next() % n; }

        private:
            uint64_t state_;
    };

    struct DatasetSpec {
        size_t docs = 1000;
        uint64_t seed = 42;
        size_t vocabulary = 20000;
        size_t topics = 64;
        size_t min_words = 80;
        size_t max_words = 600;
    };

    std::vector<RawDocument> generate_corpus(const DatasetSpec& spec);
    std::vector<std::string> generate_queries(const std::vector<RawDocument>& corpus, size_t count, uint64_t seed);
    size_t write_corpus(const std::vector<RawDocument>& docs, const std::string& dir);

}