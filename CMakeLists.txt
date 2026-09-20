cmake_minimum_required(VERSION 3.16)
project(mini_search_engine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

option(SE_BUILD_TESTS "Build unit and integration tests" ON)
option(SE_BUILD_TOOLS "Build benchmark and dataset tools" ON)
set(SE_SANITIZE "" CACHE STRING "Sanitizer to enable: address, thread or undefined")

if(SE_SANITIZE)
  add_compile_options(-fsanitize=${SE_SANITIZE} -fno-omit-frame-pointer -g)
  add_link_options(-fsanitize=${SE_SANITIZE})
endif()

find_package(Threads REQUIRED)

add_library(se_core STATIC
  src/json.cpp
  src/tokenizer.cpp
  src/document.cpp
  src/index.cpp
  src/indexer.cpp
  src/ranking.cpp
  src/query.cpp
  src/search.cpp
  src/snippet.cpp
  src/metrics.cpp
  src/sysinfo.cpp
  src/persistence.cpp
  src/engine.cpp
  src/http_server.cpp
  src/api.cpp
  src/dataset_gen.cpp
)
target_include_directories(se_core PUBLIC include)
target_link_libraries(se_core PUBLIC Threads::Threads)
target_compile_options(se_core PRIVATE -Wall -Wextra -Wpedantic)

add_executable(se_server apps/server_main.cpp)
target_link_libraries(se_server PRIVATE se_core)
target_compile_options(se_server PRIVATE -Wall -Wextra -Wpedantic)

if(SE_BUILD_TOOLS)
  add_executable(se_bench tools/bench.cpp)
  target_link_libraries(se_bench PRIVATE se_core)
  add_executable(se_gen_dataset tools/gen_dataset.cpp)
  target_link_libraries(se_gen_dataset PRIVATE se_core)
endif()

if(SE_BUILD_TESTS)
  enable_testing()
  add_executable(se_tests
    tests/test_main.cpp
    tests/test_tokenizer.cpp
    tests/test_json.cpp
    tests/test_index.cpp
    tests/test_ranking.cpp
    tests/test_query.cpp
    tests/test_cache.cpp
    tests/test_thread_pool.cpp
    tests/test_metrics.cpp
    tests/test_persistence.cpp
    tests/test_http.cpp
    tests/test_integration.cpp
  )
  target_link_libraries(se_tests PRIVATE se_core)
  target_compile_options(se_tests PRIVATE -Wall -Wextra)
  add_test(NAME se_tests COMMAND se_tests)
endif()
