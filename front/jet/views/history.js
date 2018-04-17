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
                                //console.log('item', item);
                                const sbar = this.$$("_tb").config.searchBar;
                                sbar.setValue(item);
                                sbar.refresh();
                                this.getRoot().hide();
                                //console.log('dbl_3', sbar);
                                sbar.callEvent('onKeyPress', [13,]);
                                //console.log('dbl_4', sbar);
                                //sbar.focus();
                                }
                            },
                        },
                    {},
                    ]
                }
            }
        }

    show(history, search_bar){
        this.getRoot().getHead().getChildViews()[0].setValue('История поиска');
        this.getRoot().show()
        this.$$("_tb").config.searchBar = search_bar;
        if (history) {
            this.$$("_hist").parse(history);
            };
        //console.log('sb_after_show', this.$$("_tb").config.searchBar);
        }
        
    init() {
        }
    }
