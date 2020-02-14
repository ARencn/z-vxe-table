import XEUtils from 'xe-utils'
import { UtilTools, DomTools } from '../../tools'

export default {
  name: 'VxeTableFooter',
  props: {
    footerData: Array,
    tableColumn: Array,
    visibleColumn: Array,
    fixedColumn: Array,
    size: String,
    fixedType: String
  },
  render (h) {
    let {
      $parent: $table,
      fixedType,
      fixedColumn,
      tableColumn,
      footerData
    } = this
    let {
      $listeners: tableListeners,
      id,
      footerRowClassName,
      footerCellClassName,
      footerRowStyle,
      footerCellStyle,
      footerAlign: allFooterAlign,
      footerSpanMethod,
      align: allAlign,
      tableWidth,
      scrollbarWidth,
      scrollbarHeight,
      scrollXLoad,
      scrollXStore,
      cellOffsetWidth,
      showOverflow: allColumnOverflow,
      currentColumn,
      overflowX,
      getColumnIndex
    } = $table
    // 如果是使用优化模式
    if (fixedType && allColumnOverflow && !footerSpanMethod) {
      tableColumn = fixedColumn
      tableWidth = tableColumn.reduce((previous, column) => previous + column.renderWidth, 0)
    } else if (scrollXLoad) {
      if (fixedType && !footerSpanMethod) {
        tableColumn = fixedColumn
      }
      tableWidth = tableColumn.reduce((previous, column) => previous + column.renderWidth, 0)
    }
    return h('div', {
      class: ['vxe-table--footer-wrapper', fixedType ? `fixed--${fixedType}-wrapper` : 'footer--wrapper'],
      attrs: {
        'data-tid': id
      },
      style: {
        'margin-top': `${-scrollbarHeight}px`
      },
      on: {
        scroll: this.scrollEvent
      }
    }, [
      !fixedType && scrollXLoad ? h('div', {
        class: ['vxe-body--x-space'],
        style: {
          width: `${$table.tableWidth}px`
        }
      }) : null,
      h('table', {
        class: 'vxe-table--footer',
        attrs: {
          'data-tid': id,
          cellspacing: 0,
          cellpadding: 0,
          border: 0
        },
        style: {
          width: tableWidth === null ? tableWidth : `${tableWidth + scrollbarWidth}px`,
          'margin-left': fixedType ? null : `${scrollXStore.leftSpaceWidth}px`
        }
      }, [
        /**
         * 列宽
         */
        h('colgroup', tableColumn.map((column, columnIndex) => {
          return h('col', {
            attrs: {
              name: column.id
            },
            style: {
              width: `${column.renderWidth}px`
            },
            key: columnIndex
          })
        }).concat(scrollbarWidth ? [
          h('col', {
            attrs: {
              name: 'col_gutter'
            },
            style: {
              width: `${scrollbarWidth}px`
            }
          })
        ] : [])),
        /**
         * 底部
         */
        h('tfoot', footerData.map((list, $rowIndex) => {
          return h('tr', {
            class: ['vxe-footer--row', footerRowClassName ? XEUtils.isFunction(footerRowClassName) ? footerRowClassName({ $table, $rowIndex, fixed: fixedType }) : footerRowClassName : ''],
            style: footerRowStyle ? (XEUtils.isFunction(footerRowStyle) ? footerRowStyle({ $table, $rowIndex, fixed: fixedType }) : footerRowStyle) : null
          }, tableColumn.map((column, $columnIndex) => {
            let { showOverflow, renderWidth, columnKey, footerAlign, align, footerClassName } = column
            let isColGroup = column.children && column.children.length
            let fixedHiddenColumn = fixedType ? column.fixed !== fixedType && !isColGroup : column.fixed && overflowX
            let cellOverflow = (XEUtils.isUndefined(showOverflow) || XEUtils.isNull(showOverflow)) ? allColumnOverflow : showOverflow
            let footAlign = footerAlign || align || allFooterAlign || allAlign
            let showEllipsis = cellOverflow === 'ellipsis'
            let showTitle = cellOverflow === 'title'
            let showTooltip = cellOverflow === true || cellOverflow === 'tooltip'
            let hasEllipsis = showTitle || showTooltip || showEllipsis
            let attrs = { 'data-colid': column.id }
            let tfOns = {}
            // 确保任何情况下 columnIndex 都精准指向真实列索引
            let columnIndex = getColumnIndex(column)
            let cellIndex = $table.tableColumn.indexOf(column)
            let params = { $table, $rowIndex, column, columnIndex, $columnIndex, cellIndex, cells: list, fixed: fixedType, data: footerData }
            if (showTitle || showTooltip) {
              tfOns.mouseenter = evnt => {
                if (showTitle) {
                  DomTools.updateCellTitle(evnt)
                } else if (showTooltip) {
                  $table.triggerFooterTooltipEvent(evnt, { $table, $rowIndex, column, columnIndex, $columnIndex, cellIndex, cells: list, fixed: fixedType, data: footerData, cell: evnt.currentTarget })
                }
              }
            }
            if (showTooltip) {
              tfOns.mouseleave = evnt => {
                if (showTooltip) {
                  $table.handleTargetLeaveEvent(evnt)
                }
              }
            }
            if (tableListeners['header-cell-click']) {
              tfOns.click = evnt => {
                UtilTools.emitEvent($table, 'header-cell-click', [{ $table, $rowIndex, column, columnIndex, $columnIndex, cellIndex, cells: list, fixed: fixedType, data: footerData, cell: evnt.currentTarget }, evnt])
              }
            }
            if (tableListeners['header-cell-dblclick']) {
              tfOns.dblclick = evnt => {
                UtilTools.emitEvent($table, 'header-cell-dblclick', [{ $table, $rowIndex, column, columnIndex, $columnIndex, cellIndex, cells: list, fixed: fixedType, data: footerData, cell: evnt.currentTarget }, evnt])
              }
            }
            // 合并行或列
            if (footerSpanMethod) {
              let { rowspan = 1, colspan = 1 } = footerSpanMethod(params) || {}
              if (!rowspan || !colspan) {
                return null
              }
              attrs.rowspan = rowspan
              attrs.colspan = colspan
            }
            let type = column.type === 'seq' || column.type === 'index' ? 'seq' : column.type
            return h('td', {
              class: ['vxe-footer--column', column.id, {
                [`col--${footAlign}`]: footAlign,
                [`col--${type}`]: type,
                'col--last': $columnIndex === tableColumn.length - 1,
                'fixed--hidden': fixedHiddenColumn,
                'col--ellipsis': hasEllipsis,
                'filter--active': column.filters && column.filters.some(item => item.checked),
                'col--current': currentColumn === column
              }, UtilTools.getClass(footerClassName, params), UtilTools.getClass(footerCellClassName, params)],
              attrs,
              style: footerCellStyle ? (XEUtils.isFunction(footerCellStyle) ? footerCellStyle(params) : footerCellStyle) : null,
              on: tfOns,
              key: columnKey || ($table.columnKey ? column.id : columnIndex)
            }, [
              h('div', {
                class: 'vxe-cell',
                style: {
                  width: hasEllipsis ? `${renderWidth - cellOffsetWidth}px` : null
                }
              }, column.renderFooter(h, params))
            ])
          }).concat(scrollbarWidth ? [
            h('td', {
              class: ['col--gutter'],
              style: {
                width: `${scrollbarWidth}px`
              }
            })
          ] : []))
        }))
      ])
    ])
  },
  methods: {
    /**
     * 滚动处理
     * 如果存在列固定左侧，同步更新滚动状态
     * 如果存在列固定右侧，同步更新滚动状态
     */
    scrollEvent (evnt) {
      let { $parent: $table, fixedType } = this
      let { $refs, scrollXLoad, triggerScrollXEvent } = $table
      let tableHeader = $refs.tableHeader
      let headerElem = tableHeader ? tableHeader.$el : null
      let bodyElem = $refs.tableBody.$el
      let footerElem = $refs.tableFooter.$el
      let scrollLeft = footerElem.scrollLeft
      $table.lastScrollTime = Date.now()
      if (headerElem) {
        headerElem.scrollLeft = scrollLeft
      }
      if (bodyElem) {
        bodyElem.scrollLeft = scrollLeft
      }
      if (scrollXLoad) {
        triggerScrollXEvent(evnt)
      }
      UtilTools.emitEvent($table, 'scroll', [{ type: 'footer', fixed: fixedType, scrollTop: bodyElem.scrollTop, scrollLeft, $table }, evnt])
    }
  }
}
