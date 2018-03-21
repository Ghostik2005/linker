"use strict";

import {JetView} from "webix-jet";


export default class History extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            height: document.documentElement.clientHeight * 0.8,
            on: {
                onHide: () => {
                    this.$$("_tb").clear();
                    this.$$("_hist").clearAll();
                    this.$$("_tb").reconstruct();
                    }
                },
            body: {view: 'toolbar',
                localId: "_tb",
                searchBar: undefined,
                cols: [
                    {view: "list", localId: "_hist", 
                        readonly: !true, disabled: !true,
                        width: document.documentElement.clientWidth * 0.5,
                        select: true,
                        resizeColumn:true,
                        navigation: "row",
                        editable: false,
                        on: {
                            onItemDblClick: (item) => {
                                let sbar = this.$$("_tb").config.searchBar;
                                //console.log('type', typeof item);
                                //console.log('item', item.toString());
                                //console.log('sbar', sbar);
                                sbar.setValue(item.toString());
                                //sbar.refresh();
                                this.getRoot().hide();
                                sbar.callEvent('onKeyPress', [13,]);
                                sbar.focus();
                                }
                            },
                        },
                    {},
                    ]
                }
            }
        }

    show(history, search_bar){
        this.$$("_tb").config.searchBar = search_bar;
        if (history) {
            this.$$("_hist").parse(history);
            };
        this.getRoot().getHead().getChildViews()[0].setValue('История поиска');
        this.getRoot().show()
        }
        
    init() {
        }
    }
