# CodeTwin

CodeTwin is a [LSP](https://microsoft.github.io/language-server-protocol/)-based call graph generator. It leverages the Language Server Protocol to generate interactive call graphs, helps you visually explore source code.

## Features

* Workable for various programming languages
* Highlight on click
* Two kinds of graphs

   You can generate a call graph for selected files to get an overview, or a selected function to track the call hierarchy.
* Export call graphs as SVG

## Requirements

Since CodeTwin utilizes the capabilities of language servers under the hood, if you want to analyze source code with it, you should have corresponding language extensions installed.

## Usage

* Generate a call graph for selected files and folders

    ![call graph for files](https://raw.githubusercontent.com/ramvinoth/assets/main/codetwin/code/call_graph_for_selected_files.gif)

    Select the files and folders (support multiple selections) you want to analyze, right click and select `CodeTwin: Generate Call Graph` in the context menu.

* Generate a call graph for the selected function

    ![call graph for the selected function](https://raw.githubusercontent.com/ramvinoth/assets/main/codetwin/code/call_graph_for_a_selected_function.gif)

    Right click on the function you want to analyze, and select `CodeTwin: Generate Function Call Graph` in the context menu.
