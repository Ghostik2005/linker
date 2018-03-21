"use strict";

import {JetView} from "webix-jet";
import {get_data_test} from "../views/globals";
import {getDtParams} from "../views/globals";

export default class PagerView extends JetView{
    config(){
        let app = this.app;

        var pager = {view: "toolbar",
            height: 36,
            parent: undefined,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        this.$$("__page").setValue('1');
                        this.$$("__page").refresh();
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let c_page = this.$$("__page").getValue();
                        let new_page = +c_page - 1;
                        if (new_page > 0 ) {
                            this.$$("__page").setValue(new_page);
                            this.$$("__page").refresh();
                            }
                        }
                    },
                {width: 200, type: "wide", css: 'lay_pg', cols: [
                    {view: "text", label: "Страница", localId: "__page", labelWidth: 70, width: 120, value: "1", css: "center_p", manual: true,
                        on: {
                            onChange: (new_val, old_val) => {
                                if (this.$$("__page").config.manual) {
                                    let page;
                                    if (1 === +old_val && 0 === +new_val) {
                                        page = 1
                                    } else {
                                        page = this.$$("__page").getValue();
                                        };
                                    let posPpage = this.getRoot().config.parent.config.posPpage;
                                    let total_pages = Math.ceil(this.getRoot().config.parent.config.totalPos/posPpage)
                                    try {
                                        page = +page
                                    } catch(Err) {
                                        };
                                    if (typeof page === 'number' && page >= 0 && (total_pages = 0 || page <= (total_pages===0) ? 1 : total_pages)) {
                                        let start = (page-1) * posPpage + 1;
                                        let ui = this.getRoot().config.parent;
                                        if (ui) {
                                            let params = getDtParams(ui);
                                            //console.log(this.getRoot().config.parent.$scope.getParentView().getRoot().getChildViews()[0].getChildViews()[0]);
                                            let name_ch, cbars;
                                            try {
                                                name_ch = (this.getRoot().config.parent.$scope.getParentView().getRoot().getChildViews()[1].getChildViews()[0].config.name === "__dtd")
                                            } catch(err) {
                                                };
                                            if (name_ch) cbars = ($$("__checkbars").getValue() === 1) ? "0,100" : $$("_bar_num").getValue();
                                            get_data_test({
                                                view: this.getRoot().config.parent,
                                                navBar: this.getRoot(),
                                                start: start,
                                                count: params[1],
                                                searchBar: this.getRoot().config.parent.config.searchBar,
                                                method: this.getRoot().config.parent.config.searchMethod,
                                                field: params[2],
                                                direction: params[3],
                                                filter: params[0],
                                                cbars: cbars
                                                });
                                            };
                                        };
                                } else {
                                    this.$$("__page").config.manual = true;
                                    }
                                },
                            },
                        },
                    {view: "label", label: "из", width:30},
                    {view: "label", label: "1", width: 50, css: "p_center_p"},
                    ]},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let c_page = this.$$("__page").getValue();
                        let new_page = +c_page + 1;
                        if (new_page <= Math.ceil(this.getRoot().config.parent.config.totalPos/this.getRoot().config.parent.config.posPpage)) {
                            this.$$("__page").setValue(new_page);
                            this.$$("__page").refresh();
                            }
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let total_pages = Math.ceil(this.getRoot().config.parent.config.totalPos/this.getRoot().config.parent.config.posPpage)
                        this.$$("__page").setValue(total_pages);
                        this.$$("__page").refresh();
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180},
                ]
            }

        return pager

        }

    init(view) {
        //console.log('p view', view.getParentView())
        this.getRoot().config.parent = view.getParentView().$scope.$$("__table");
        }

    }


