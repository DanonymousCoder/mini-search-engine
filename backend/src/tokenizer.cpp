#include "se/tokenizer.hpp"
#include <cctype>

namespace se
{
    std::vector<std::string> Tokenizer::tokenize(const std::string &text)
    {
        std::vector<std::string> tokens;
        std::string current_token;

        for (char c : text)
        {
            if (std::isalnum(static_cast<unsigned char>(c)))
            {
                current_token += static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            }
            else if (!current_token.empty())
            {
                tokens.push_back(std::move(current_token));
                current_token.clear();
            }
        }

        if (!current_token.empty)
        {
            tokens.push_back(std::move(current_token));
        }

        return tokens;

        return tokens;
    }
}