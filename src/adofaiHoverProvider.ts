import * as vscode from 'vscode';
import { comment } from '../adofai-comment.json';

export class AdofaiHoverProvider implements vscode.HoverProvider {
    private comments: { [key: string]: { en: string, zh: string, ko: string } } = comment;

    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
        try {
            // 获取当前行的文本
            const line = document.lineAt(position.line).text;

            // 匹配行中所有键名
            const keyMatches = [...line.matchAll(/(?<=")([^"]+)(?="\s*:)/g)];
            if (keyMatches.length === 0) return null;

            let targetKey: string | null = null;
            let targetRange: vscode.Range | null = null;

            for (const keyMatch of keyMatches) {
                const key = keyMatch[0];
                const startIndex = keyMatch.index!;
                const endIndex = startIndex + key.length + 2; // +2 for quotes

                const keyStartPos = new vscode.Position(position.line, startIndex);
                const keyEndPos = new vscode.Position(position.line, endIndex);
                const keyRange = new vscode.Range(keyStartPos, keyEndPos);

                if (keyRange.contains(position)) {
                    targetKey = key;
                    targetRange = keyRange;
                    break;
                }
            }

            if (!targetKey || !targetRange) return null;

            // 查找对应的提示信息（支持嵌套结构）
            let commentInfo = this.comments[targetKey];
            
            // 如果直接匹配失败，尝试匹配嵌套结构
            if (!commentInfo) {
                const keys = targetKey.split('.');
                let currentLevel: any = this.comments;
                
                for (const k of keys) {
                    if (currentLevel && currentLevel[k]) {
                        currentLevel = currentLevel[k];
                    } else {
                        currentLevel = null;
                        break;
                    }
                }
                
                if (currentLevel && currentLevel.en) {
                    commentInfo = currentLevel;
                }
            }

            if (!commentInfo) return null;

            // 获取 VSCode 当前语言设置
            const vscodeLanguage = vscode.env.language.toLowerCase();
            
            // 构建多语言提示（根据当前语言选择）
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${targetKey}**\n\n`);
            
            // 根据语言环境显示相应的提示
            if (vscodeLanguage.startsWith('zh-cn')) {
                markdown.appendMarkdown(commentInfo.zh);
            } else if (vscodeLanguage.startsWith('ko')) {
                markdown.appendMarkdown(commentInfo.ko);
            } else {
                // 默认显示英文（包括 en 和其他语言）
                markdown.appendMarkdown(commentInfo.en);
            }

            return new vscode.Hover(markdown, targetRange);
        } catch (error) {
            console.error('Hover error:', error);
            return null;
        }
    }
}