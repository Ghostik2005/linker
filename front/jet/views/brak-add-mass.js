//"use strict";

import { JetView } from "webix-jet";
import { request, checkVal } from "../views/globals";

export default class BrakAddMassView extends JetView {
    config() {
        let app = this.app;

        let view = {
            view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    var childs = this.$$("_lists").getChildViews();
                    for (var j = childs.length; j > 0; j--) {
                        this.$$("_lists").removeView(childs[j - 1].config.id)
                    }
                },
            },
            body: {
                view: "form", margin: 0,

                height: document.documentElement.clientHeight * .5,
                width: 730,
                scroll: true,
                elements: [
                    {
                        cols: [
                            { view: "label", label: "Препарат:", height: 32, width: 100 },
                            { view: "label", label: "", height: 32, localId: "_tovar", css: "highlited" },
                        ]
                    },
                    {
                        cols: [
                            { view: "label", label: "Письмо:", height: 32, width: 100 },
                            { view: "label", label: "", height: 32, localId: "_letter", css: "highlited" },
                        ]
                    },
                    { view: "label", label: "Серии:", height: 32 },
                    {
                        view: "layout", localId: "_lists", rows: [
                        ]
                    },
                    {},
                    {
                        cols: [
                            {
                                view: "button", type: "base", label: "Нет", width: 120, height: 32,
                                click: () => {
                                    this.hide_w()
                                }
                            },
                            {},
                            {
                                view: "button", type: "base", label: "Да", width: 120, height: 32, localId: "_yes",
                                click: () => {
                                    let datas = [];
                                    let childs = this.$$("_lists").getChildViews();
                                    childs.forEach((child) => {
                                        if (child.config.view === "list") {
                                            child.data.each((item) => {
                                                if (item.ch === 1) {
                                                    datas.push(item.series);
                                                }
                                            })
                                        }
                                    });
                                    if (datas.length > 0) {
                                        let url = "setMassBrakMail";
                                        this.item.id = 99999999;
                                        let params = { "user": app.config.user, "item": this.item, "series_list": datas };
                                        let res = request(url, params, !0, app).response;
                                        res = checkVal(res, 's');
                                        if (res) {
                                            webix.message({ type: "success", text: "Сохранено", expire: 2500 });
                                            this.parent.$$("_ls").callEvent("onKeyPress", [13,]);
                                        } else {
                                            webix.message({ type: "error", text: "Ошибка сохранения", expire: 2500 });
                                        };

                                        // console.log('datas', params);
                                    }
                                    this.hide_w();

                                }
                            }
                        ]
                    }
                ],
            }
        }

        return view
    }

    show_w(parent, item, similar) {
        this.parent = parent;
        this.item = item;
        let list_count = 5;//выставляем количество элементов в одном списке
        let list_view = {
            view: "list", layout: "x", select: false, scroll: false, height: 32,
            template: "{common.checkBox()} #series#",
            type: {
                width: 140,
                checkBox: function (obj) {
                    return "<span class='check webix_icon fa-" + (obj.ch ? "check-" : "") + "square-o'></span>";
                }
            },
            onClick: {
                "check": function (e, id) {
                    var item = this.getItem(id);
                    item.ch = item.ch ? 0 : 1;
                    this.updateItem(id, item);
                }
            },
        };
        this.$$("_tovar").setValue(item.name);
        this.$$("_letter").setValue(item.n_doc);
        let count = Math.ceil(similar.length / list_count);
        for (var i = 0; i < count; i++) {
            this.$$("_lists").addView(list_view);
        };
        var lists = this.$$("_lists").getChildViews();
        lists.forEach((list_item) => {
            let data = [];
            var ends = list_count;
            for (var k = 0; k < ends; k++) {
                if (similar.length > 0) {
                    let item_push = similar.pop(0);
                    item_push.ch = 0;
                    data.push(item_push)
                };
            };
            if (list_item.config.view === "list") {
                list_item.parse(data);
            };
        });
        this.getRoot().getHead().getChildViews()[0].setValue("Есть другие серии с таким препаратом. Привязать?");
        this.getRoot().show();
    }

    hide_w() {
        this.getRoot().hide()
    }

    ready(view) {
    }

    init(view) {
    }
}


