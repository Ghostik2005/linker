"use strict";

import { JetView } from "webix-jet";
import { DelEdIcons, singleRefReload, setButtons, addItem, delItem, updItem, request, checkVal } from "../views/globals";
import { refTemplate } from "../views/globals";
import NewPropView from "../views/new_prop";

export default class CountryView extends JetView {
    config() {
        let app = this.app;
        var sprv = {
            view: "datatable",
            name: "_country",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn: true,
            fixedRowHeight: false,
            rowLineHeight: 32,
            rowHeight: 32,
            editable: false,
            headermenu: true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            type: {
                itemIcon: DelEdIcons,
            },
            onClick: {
                delete_button: function (ev, id, html) {
                    let item = this.getItem(id);
                    if (item.delete === false) {
                        webix.message({ "type": "debug", "text": "Удаление группы " + item.c_issue + " невозможно", "expire": 5000 });
                        return
                    };
                    setTimeout(() => {
                        this.select(item.id, false);
                        this.$scope.$$("_del").callEvent("onItemClick");
                    }, 50)
                },
                edit_button: function (ev, id, html) {
                    this.select(id, false);
                    this.callEvent("onItemDblClick", id);
                },
            },
            columns: [
                {
                    id: "c_strana", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{ text: "Страна" },
                    ],
                    template: refTemplate,
                },
                {
                    id: "id", sort: 'text',
                    width: 150,
                    header: [{ text: "ID" },
                    ],
                },
                {
                    id: "id_state", hidden: true,
                    width: 150,
                    header: [{ text: "Статус" },
                    ]
                },
                {
                    id: "dt", hidden: true,
                    width: 250,
                    header: [{ text: "Дата заведения" },
                    ]
                }
            ],
            on: {
                "data->onParse": function (i, data) {
                    this.clearAll();
                },
                onBeforeRender: function () {
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                        });
                    }
                },
                onAfterRender: function (data) {
                    // let butts =  Array.from(document.getElementsByClassName("delete_button"));
                    let butts = Array.prototype.slice.call(document.getElementsByClassName("delete_button"));
                    butts.forEach((butt) => {
                        butt.onmousedown = (event) => {
                            this.$scope.$$("_del").blockEvent();
                            butt.onmouseup = () => {
                                clearInterval(this.interval);
                            };
                            this.interval = setTimeout(() => {
                                this.$scope.$$("_del").unblockEvent();
                            }, app.config.popDelay);
                        }
                    });
                },
                onItemDblClick: function (item) {
                    item = this.getSelectedItem();
                    let params = { 'text': item.c_strana, 'id': item.id, 'type': 'Strana', 'callback': updItem, 'mode': 'upd', 'source': this };
                    this.$scope.popnew.show('Редактирование страны', params);
                },
                onAfterLoad: function () {
                    this.hideProgress();
                },
                onBeforeSelect: () => {
                    //this.$$("_del").show();
                },
                onKeyPress: function (code, e) {
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                    }
                },
            },
        }

        var top = {
            height: 40, view: "toolbar",
            cols: [
                {
                    view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска",
                    keyPressTimeout: 900, tooltip: "поиск по стране",
                    on: {
                        onTimedKeyPress: function (code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__table").filter(function (obj) {
                                return obj.c_strana.toString().toLowerCase().indexOf(value) != -1;
                            })
                        }
                    },
                },
                {
                    view: "button", type: 'htmlbutton', tooltip: "Добавить страну",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    localId: "_add",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Добавить страну</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        let params = { 'type': 'Strana', 'callback': addItem, 'mode': 'new', 'source': this.$$("__table") };
                        this.popnew.show('Добавление страны', params);
                    }
                },
                {
                    view: "button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить страну",
                    //label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    resizable: true, sWidth: 180, eWidth: 40, label: "", width: 40,
                    extLabel: "<span class='button_label'>Удалить страну</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    on: {
                        onItemClick: () => {
                            let item_id = this.$$("__table").getSelectedItem().id
                            let params = {};
                            params['user'] = this.app.config.user;
                            params['id'] = item_id;
                            let url = "delStrana";
                            let res = request(url, params, !0, this.app).response;
                            res = checkVal(res, 's');
                            if (res) {
                                delItem('Strana', res.id, this.$$("__table"));
                                this.$$("_del").hide()
                            };
                        },
                    },
                },
            ]
        }

        return {
            view: "layout",
            rows: [
                top,
                sprv,
            ]
        }
    }

    ready() {
        let r_but = [this.$$("_add"), this.$$("_del")]
        setButtons(this.app, r_but);
        singleRefReload(this.app, "getStranaAll", this.$$("__table"));
    }

    init() {
        this.popnew = this.ui(NewPropView);
        webix.extend(this.$$("__table"), webix.ProgressBar);
        //this.$$("__table").sync(strana.data);
    }
}
