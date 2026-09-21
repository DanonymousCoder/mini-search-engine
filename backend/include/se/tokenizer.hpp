#pragma once
#include <string>
#include <vector>

namespace se
{
    class Tokenizer
    {
    public:
        static std::vector<std::string> tokenize(const std::string &text);
    };
}