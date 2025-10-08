import * as vscode from "vscode"
import ADOFAIX from "./adofai-parser"
import { AdofaiHoverProvider } from './adofaiHoverProvider';

export function activate(context: vscode.ExtensionContext) {
    // 注册悬浮提示
    const hoverProvider = new AdofaiHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('adofai', hoverProvider)
    );
    
    // 启用 JSON 树状视图
    vscode.commands.executeCommand('setContext', 'json:enableTree', true);

    // 转换命令
    const convertCommand = vscode.commands.registerCommand("adofai.convertToJson", async () => {
        const editor = vscode.window.activeTextEditor

        if (!editor) {
            vscode.window.showErrorMessage("No Editors are open")
            return
        }

        const document = editor.document

        // Check if it's an ADOFAI file
        if (!document.fileName.endsWith(".adofai")) {
            vscode.window.showErrorMessage("Current file is not an ADOFAI file")
            return
        }

        try {
            const text = document.getText()

            // Parse ADOFAI content using the custom parser
            const parsed = ADOFAIX.parse(text)

            if (parsed === null) {
                vscode.window.showErrorMessage("Failed to parse ADOFAI file")
                return
            }

            // Convert to standard JSON with formatting
            const jsonString = JSON.stringify(parsed, null, 2)

            // Replace the entire document content
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))

            await editor.edit((editBuilder) => {
                editBuilder.replace(fullRange, jsonString)
            })

            vscode.window.showInformationMessage("Successfully converted to standard JSON format")
        } catch (error) {
            vscode.window.showErrorMessage(`Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
    })

    context.subscriptions.push(convertCommand)
}

export function deactivate() { }