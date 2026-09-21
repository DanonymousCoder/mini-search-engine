#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>
#include "se/engine.hpp"

namespace se
{
    BuildStats SearchEngine::build_from_directory(const std::string &dir_path, size_t workers)
    {
        BuildStats stats{};
        uint32_t current_doc_id = 0;

        std::vector<Document> document_store;

        for (const auto &entry : std::filesystem::recursive_directory_iterator(dir_path))
        {
            if (!entry.is_regular_file())
                continue;

            // Check extension
            std::string ext = entry.path().extension().string();
            if (ext != ".txt" && ext != ".md")
            {
                stats.skipped_binary++;
                continue;
            }

            // Open file
            std::string filepath = entry.path().string();
            std::ifstream file(filepath);

            if (!file.is_open())
            {
                stats.skipped_unreadable++;
                continue;
            }

            std::string line;
            size_t byte_count = 0;

            while (std::getline(file, line))
            {
                byte_count += line.size() + 1;
            }

            if (byte_count == 0)
            {
                stats.skipped_empty++;
                continue;
            }

            document_store.push_back(Document{current_doc_id, filepath, byte_count});

            std::string full_content;
            std::string line;
            while (std::getline(file, line))
            {
                full_content += line + '\n';
            }

            if (full_content.empty())
            {
                stats.skipped_empty++;
                continue;
            }

            document_store_.push_back(Document{current_doc_id, filepath, full_content.size()});

            std::vector<std::string> tokens = Tokenizer::tokenize(full_content);

            for (const std::string &token : tokens)
            {
                auto &posting_list = index_[token];
                if (posting_list.empty() || posting_list.back() != current_doc_id)
                {
                    posting_list.push_back(current_doc_id);
                    stats.postings++;
                }
            }

            current_doc_id++;
            stats.documents++;

            std::cout << "[DEBUG] Ingested " << document_store.size() << " text files. \n";
        }

        stats.unique_terms = index_.size();
        return stats;
    }
}