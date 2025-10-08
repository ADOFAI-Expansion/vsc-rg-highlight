import * as vscode from 'vscode';
import { parseTree, findNodeAtLocation, Node } from 'jsonc-parser';

export async function getJsonPathAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<string | null> {
    try {
        const text = document.getText();
        const root = parseTree(text);
        if (!root) return null;

        const offset = document.offsetAt(position);
        const node = findNodeAtLocation(root, getJsonPath(root, offset));
        return node ? getFullPath(node) : null;
    } catch (error) {
        console.error('Path resolution error:', error);
        return null;
    }
}

function getJsonPath(root: Node, offset: number): string[] {
    const path: string[] = [];
    let node: Node | undefined = root;
    
    while (node) {
        if (node.type === 'property') {
            const keyNode = node.children?.[0];
            if (keyNode?.offset !== undefined && keyNode.length !== undefined) {
                path.push(keyNode.value);
            }
            node = node.children?.[1];
            continue;
        }
        
        if (node.type === 'object' || node.type === 'array') {
            const children = node.children;
            if (!children) break;
            
            for (const child of children) {
                if (child.offset <= offset && offset <= child.offset + child.length) {
                    node = child;
                    break;
                }
            }
            continue;
        }
        
        break;
    }
    
    return path;
}

function getFullPath(node: Node): string {
    const path: string[] = [];
    let current: Node | undefined = node;
    
    while (current && current.parent?.type === 'property') {
        const keyNode = current.parent.children?.[0];
        if (keyNode?.value) {
            path.unshift(keyNode.value);
        }
        current = current.parent.parent;
    }
    
    return path.join('.');
}