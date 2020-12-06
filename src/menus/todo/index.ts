import $, { DomElement } from '../../utils/dom-core'
import BtnMenu from '../menu-constructors/BtnMenu'
import Editor from '../../editor/index'
import { MenuActive } from '../menu-constructors/Menu'
import { isAllTodo } from './util'
import bindEvent from './bind-event'
import createTodo from './todo'

class Todo extends BtnMenu implements MenuActive {
    constructor(editor: Editor) {
        const $elem = $(
            `<div class="w-e-menu">
                    <i class="w-e-icon-checkbox-checked"></i>
                </div>`
        )
        super($elem, editor)
        bindEvent(editor)
    }

    /**
     * 点击事件
     */
    public clickHandler(): void {
        const editor = this.editor
        if (!isAllTodo(editor)) {
            // 设置todolist
            this.setTodo()
        } else {
            // 取消设置todolist
            this.cancelTodo()
            this.unActive()
        }
    }
    tryChangeActive() {
        if (isAllTodo(this.editor)) {
            this.active()
        } else {
            this.unActive()
        }
    }

    /**
     * 设置todo
     */
    private setTodo() {
        const editor = this.editor
        const topNodeElem: DomElement[] = editor.selection.getSelectionRangeTopNodes(editor)
        // 增加垫片防止无法删除的情况
        if (topNodeElem[0].prev().length === 0) {
            $(`<p style="height:0px;"><br></p>`).insertBefore(topNodeElem[0])
        }
        topNodeElem.forEach($node => {
            const nodeName = $node?.getNodeName()
            if (nodeName === 'P') {
                const img = $node.children()?.get() as DomElement
                // 对于图片进行特殊处理
                if (img?.length > 0 && img?.getNodeName() === 'IMG') {
                    return
                }
                const todo = createTodo($node)
                const todoNode = todo.getTodo()
                const child = todoNode.children()?.getNode() as Node
                const textNode = todoNode.childNodes()?.childNodes()?.last().selector as Node
                todoNode.insertAfter($node)
                todoNode.text() === ''
                    ? editor.selection.moveCursor(child, 1)
                    : editor.selection.moveCursor(textNode)
                $node.remove()
                this.active()
            }
        })
    }

    /**
     * 取消设置todo
     */
    private cancelTodo() {
        const editor = this.editor
        const $topNodeElems: DomElement[] = editor.selection.getSelectionRangeTopNodes(editor)

        $topNodeElems.forEach($topNodeElem => {
            let content = $topNodeElem.childNodes()?.childNodes()?.clone(true) as DomElement
            const $p = $(`<p></p>`)
            $p.append(content)
            $p.insertAfter($topNodeElem)
            // 移除input
            $p.childNodes()?.get(0).remove()
            editor.selection.moveCursor($p.getNode())
            $topNodeElem.remove()
        })
    }
}

export default Todo
