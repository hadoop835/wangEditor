import Editor from '../../../editor/index'
import $ from '../../../utils/dom-core'
import { getNewNode, isAllTodo } from '../util'
import createTodo from '../todo'

/**
 * todolist 内部逻辑
 * @param editor
 */
function bindEvent(editor: Editor) {
    /**
     * todo的自定义回车事件
     * @param e 事件属性
     */
    function todoEnter(e: Event) {
        // 判断是否为todo节点
        if (isAllTodo(editor)) {
            e.preventDefault()

            const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
            const $li = $topSelectElem.childNodes()?.get(0)
            const selectionNode = window.getSelection()?.anchorNode as Node

            // 回车时内容为空时，删去此行
            if ($topSelectElem.text() === '') {
                const $p = $(`<p><br></p>`)
                $p.insertAfter($topSelectElem)
                editor.selection.moveCursor($p.getNode())
                $topSelectElem.remove()
                return
            }

            const pos = editor.selection.getCursorPos() as number
            const newNode = getNewNode($li?.getNode() as Node, selectionNode, pos)
            const todo = createTodo($(newNode))
            const $inputcontainer = todo.getInputContainer()
            const $newTodo = todo.getTodo()
            // 处理光标在最前面时回车input不显示的问题
            if ($li?.text() === '') {
                $li?.append($(`<br>`))
            }
            $newTodo.insertAfter($topSelectElem)
            // 处理在google中光标在最后面的，input不显示的问题(必须插入之后移动光标)
            if (
                !$inputcontainer.getNode().nextSibling ||
                $inputcontainer.getNode().nextSibling?.textContent === ''
            ) {
                // 防止多个br出现的情况
                if ($inputcontainer.getNode().nextSibling?.nodeName !== 'BR') {
                    const $br = $(`<br>`)
                    $br.insertAfter($inputcontainer)
                }
                editor.selection.moveCursor($inputcontainer.parent().getNode(), 1)
            } else {
                editor.selection.moveCursor($inputcontainer.parent().getNode())
            }
        }
    }

    /**
     * 自定义删除事件，用来处理光标在最前面删除input产生的问题
     */
    function delDown(e: Event) {
        if (isAllTodo(editor)) {
            const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
            const $li = $topSelectElem.childNodes()?.getNode()
            const $p = $(`<p></p>`)
            const p = $p.getNode()
            const selectionNode = window.getSelection()?.anchorNode as Node
            const pos = editor.selection.getCursorPos()
            const prevNode = selectionNode.previousSibling

            // 处理内容为空的情况
            if ($topSelectElem.text() === '') {
                e.preventDefault()
                const $newP = $(`<p><br></p>`)
                $newP.insertAfter($topSelectElem)
                $topSelectElem.remove()
                editor.selection.moveCursor($newP.getNode(), 0)
                return
            }

            // 处理有内容时，光标在最前面的情况
            if (
                prevNode?.nodeName === 'SPAN' &&
                prevNode.childNodes[0].nodeName === 'INPUT' &&
                pos === 0
            ) {
                e.preventDefault()
                $li?.childNodes.forEach((v, index) => {
                    if (index === 0) return
                    p.appendChild(v.cloneNode(true))
                })
                $p.insertAfter($topSelectElem)

                $topSelectElem.remove()
            }
        }
    }
    editor.txt.eventHooks.enterDownEvents.push(todoEnter)
    editor.txt.eventHooks.deleteDownEvents.push(delDown)
}

export default bindEvent
