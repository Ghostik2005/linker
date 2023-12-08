"use strict";

import { JetView } from "webix-jet";
import { DelEdIcons, singleRefReload, setButtons, addItem, delItem, updItem, request, checkVal } from "../views/globals";
import { refTemplate } from "../views/globals";
import NewDvView from "../views/new_dv";

export default class DvView extends JetView {
    config() {
        let app = this.app;
        var sprv = {
            view: "datatable",
            name: "_dv",
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
                    id: "act_ingr",
                    fillspace: 1, sort: "text", headermenu: false,
                    header: [{ text: "Действующее вещество" },
                        //{content:"textFilter"}
                    ],
                    template: refTemplate,
                },
                {
                    id: "oa",
                    width: 200, sort: "text",
                    header: [{ text: "Обязательный ассортимент" },
                    { content: "selectFilter" }
                    ]
                },
                {
                    id: "prod_forms",
                    width: 200, hidden: true,
                    headermenu: false,
                    // sort: "text",
                    header: [{ text: "Формы выпуска АО" },
                        // { content: "selectFilter" }
                    ]
                },
                {
                    id: "prod_forms_text",
                    width: 200,
                    hidden: true,
                    // sort: "text",
                    header: [{ text: "Формы выпуска АО" },
                        // { content: "selectFilter" }
                    ]
                },
                {
                    id: "compare_prod_forms",
                    width: 30, hidden: true,
                    headermenu: false,
                    header: [{ text: "Cравнение форм выпуска" },
                    ]
                },
                {
                    id: "prod_forms_ap_text",
                    width: 200,
                    hidden: true,
                    // sort: "text",
                    header: [{ text: "Формы выпуска АО для АП" },
                        // { content: "selectFilter" }
                    ]
                },
                {
                    id: "compare_prod_forms_ap",
                    width: 30, hidden: true,
                    headermenu: false,
                    header: [{ text: "Cравнение форм выпуска для АП" },
                    ]
                },
                {
                    id: "id",
                    width: 75, sort: "text",
                    header: [{ text: "ID" },
                        //{content:"selectFilter"}
                    ],
                },
                {
                    id: "id_state",
                    width: 150, hidden: true,
                    header: [{ text: "Статус" },
                        //{content:"selectFilter"}
                    ]
                },
                {
                    id: "dt",
                    width: 250, hidden: true,
                    header: [{ text: "Дата заведения" },
                        //{content:"selectFilter"}
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
                    let params = {
                        'text': item.act_ingr, 'id': item.id, "oa": item.oa,
                        "prod_forms_text": item.prod_forms_text,
                        "compare_prod_forms": item.compare_prod_forms,
                        "prod_forms_ap_text": item.prod_forms_ap_text,
                        "compare_prod_forms_ap": item.compare_prod_forms_ap,
                        'type': 'Dv', 'callback': updItem, 'mode': 'upd', 'source': this
                    };
                    //console.log(params);
                    this.$scope.popnew.show('Редактирование действующего в-ва', params);
                },
                onAfterLoad: function () {
                    this.hideProgress();
                },
                onBeforeSelect: () => {
                    //this.$$("_del").show()
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
                    keyPressTimeout: 900, tooltip: "поиск по действующему веществу",
                    on: {
                        onTimedKeyPress: function (code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__table").filter(function (obj) {
                                return obj.act_ingr.toString().toLowerCase().indexOf(value) != -1;
                            })
                        }
                    },
                },
                {
                    view: "button", type: 'htmlbutton', tooltip: "Добавить действующее вещество",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    localId: "_add",
                    resizable: true,
                    sWidth: 160,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Добавить ДВ</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        let params = { 'type': 'Dv', 'callback': addItem, 'mode': 'new', 'source': this.$$("__table") };
                        this.popnew.show('Добавление действующего в-ва', params);
                    }
                },
                {
                    view: "button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить дейтсвующее вещество",
                    //label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    resizable: true, sWidth: 160, eWidth: 40, label: "", width: 40,
                    extLabel: "<span class='button_label'>Удалить ДВ</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    on: {
                        onItemClick: () => {
                            let item_id = this.$$("__table").getSelectedItem().id
                            let params = {};
                            params['user'] = this.app.config.user;
                            params['id'] = item_id;
                            let url = "delDv";
                            let res = request(url, params, !0, this.app).response;
                            res = checkVal(res, 's');
                            if (res) {
                                delItem('Dv', res.id, this.$$("__table"));
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
        singleRefReload(this.app, "getDvAll", this.$$("__table"));
    }

    init() {
        this.popnew = this.ui(NewDvView);
        webix.extend(this.$$("__table"), webix.ProgressBar);
        //this.$$("__table").sync(dv.data);
    }
}
