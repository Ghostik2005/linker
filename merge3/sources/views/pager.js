"use strict";

import {JetView} from "webix-jet";
import {get_data_test} from "../views/globals";
import {getDtParams} from "../views/globals";

export default class PagerView extends JetView{
    config(){

        var pager = {view: "toolbar",
            //height: 36,
            cols: [
                {view: "button", //type: 'htmlbutton',
                    height: 36,
                    //label: "<span class='webix_icon fas fa-angle-double-left'></span>", 
                    width: 36,
                    type:"imageButton", image: './library/img/double-left-arrows.svg',
                    click: () => {
                        this.$$("__page").setValue('1');
                        this.$$("__page").refresh();
                    }
                },
                {view: "button", //type: 'htmlbutton',
                    //label: "<span class='webix_icon fas fa-angle-left'></span>", 
                    width: 36,
                    type:"imageButton", image: './library/img/left-arrow.svg',
                    click: () => {
                        let c_page = this.$$("__page").getValue();
                        let new_page = +c_page - 1;
                        if (new_page > 0 ) {
                            this.$$("__page").setValue(new_page);
                            this.$$("__page").refresh();
                        }
                    }
                },
                {width: 7},
                {width: 200, type: "wide", css: 'pager-text', 
                    cols: [
                    {view: "text", label: "<span style='font-size: smaller'>Страница</span>", 
                        css: "custom-input",
                        localId: "__page",
                        labelWidth: 65, width: 120, value: "1", manual: true,
                        on: {
                            onChange: (new_val, old_val) => {
                                if (this.$$("__page").config.manual) {
                                    let page;
                                    if (1 === +old_val && 0 === +new_val) {
                                        page = 1
                                    } else {
                                        page = this.$$("__page").getValue();
                                        };
                                    let posPpage = this.parent.config.posPpage;
                                    let total_pages = Math.ceil(this.parent.config.totalPos/posPpage)
                                    try {
                                        page = +page
                                    } catch(Err) {
                                    };
                                    if (typeof page === 'number' && page >= 0 && (total_pages = 0 || page <= (total_pages===0) ? 1 : total_pages)) {
                                        let start = (page-1) * posPpage + 1;
                                        let ui = this.parent;
                                        if (ui) {
                                            let params = getDtParams(ui);
                                            get_data_test({
                                                view: this.parent,
                                                navBar: this.getRoot(),
                                                start: start,
                                                count: params[1],
                                                searchBar: this.parent.config.searchBar,
                                                method: this.parent.config.searchMethod,
                                                field: params[2],
                                                direction: params[3],
                                                filter: params[0]
                                            });
                                        };
                                    };
                                } else {
                                    this.$$("__page").config.manual = true;
                                }
                            },
                        },
                    },
                    {view: "label", label: "<span style='font-size: smaller'>из</span>", width:30,
                        css: {"margin-left": "0px !important"}
                    },
                    {view: "label", label: "1", width: 45, align: "center",
                        css: {"margin-left": "0px !important", "margin-top": "-2px !important", "line-height": "38px !important"}
                    },
                ]},
                {view: "button", //type: 'htmlbutton',
                    //label: "<span class='webix_icon fas fa-angle-right'></span>", 
                    width: 36,
                    type:"imageButton", image: './library/img/right-arrow.svg',
                    click: () => {
                        let c_page = this.$$("__page").getValue();
                        let new_page = +c_page + 1;
                        if (new_page <= Math.ceil(this.parent.config.totalPos/this.parent.config.posPpage)) {
                            this.$$("__page").setValue(new_page);
                            this.$$("__page").refresh();
                        }
                    }
                },
                {view: "button", //type: 'htmlbutton',
                    //label: "<span class='webix_icon fas fa-angle-double-right'></span>", 
                    width: 36,
                    type:"imageButton", image: './library/img/double-right-arrows.svg',
                    click: () => {
                        let total_pages = Math.ceil(this.parent.config.totalPos/this.parent.config.posPpage)
                        this.$$("__page").setValue(total_pages);
                        this.$$("__page").refresh();
                    }
                },
                {},
                {view: "label", label: "<span style='font-size: smaller'>Всего записей: 0</span>", width: 170, 
                    css: {"margin-left": "0px !important", "margin-right": "3px !important"}, align: "right"
                },
            ]
        }

        return pager

    }

    ready(view) {
    }

    init(view) {
        this.parent = view.getParentView().$scope.$$("__table");
    }
}


