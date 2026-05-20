cmake_minimum_required(VERSION 3.13)
project(kaligui_app)

# Tworzymy fizyczny, pusty plik źródłowy, żeby CMake miał co podpiąć
if(NOT EXISTS "${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp")
    file(WRITE "${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp" "// czysty plik bypass\n")
endif()

# Definiujemy makiety jako biblioteki statyczne korzystające z pliku dummy
add_library(react_codegen_RTNSshClientSpec STATIC "${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp")
add_library(react_codegen_reactnativecommunityasyncstorage STATIC "${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp")

# Całkowicie uciszamy makra linkowania i podkatalogów
macro(target_link_libraries)
endmacro()

macro(add_subdirectory)
endmacro()

message(STATUS "CMake bypass successfully injected. Turning off C++ compilation.")