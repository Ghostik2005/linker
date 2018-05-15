"use strict";

import {JetView} from "webix-jet";
//import {strana, addStrana, delStrana, updStrana, request, checkVal} from "../views/globals";
import {allIs, addIssue, delIssue, updIssue, request, checkVal} from "../views/globals";
import NewPropView from "../views/new_prop";

export default class IssueView extends JetView{
    config(){
        var app = this.app;
        var sprv = {view: "datatable",
            localId: "__dti",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            columns: [
                {id: "id", sort: "text",
                    width: 75,
                    header: [{text: "ID"},
                        ],
                    },
                { id: "c_issue", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Форма выпуска"},
                        ]
                    },
                { id: "id_state", 
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    let params = {'text': item.c_issue, 'id': item.id, 'type': 'Issue', 'callback': updIssue, 'mode': 'upd', 'source': this};
                    this.$scope.popnew.show('Редактирование формы выпуска', params);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").show();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {height: 40, view: "toolbar",
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "поиск по форме выпуска",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__dti").filter(function(obj){
                                return obj.c_issue.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить форму выпуска",
                    label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    click: () => {
                        let url = app.config.r_url + "?getIsId"
                        let params = {"user": app.config.user};
                        let res = request(url, params, !0).response;
                        params = {'type': 'Issue', 'callback': addIssue, 'mode': 'new', 'source': this.$$("__dti")};
                        res = checkVal(res, 's');
                        if (res) {
                            params['id_is'] = res;
                            };
                        this.popnew.show('Добавление формы выпуска', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить форму выпуска",
                    label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    click: () => {
                        let item_id = this.$$("__dti").getSelectedItem().id
                        let params = {};
                        params['user'] = this.app.config.user;
                        params['id'] = item_id;
                        let url = this.app.config.r_url + "?delIssue";
                        let res = JSON.parse(request(url, params, !0).response);
                        if (res.result) {
                            console.log(res.ret_val.id)
                            delIssue(res.ret_val.id);
                            this.$$("_del").hide()
                        } else {
                            webix.message({'type': 'error', 'text': res.ret_val})
                            };
                        }
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
        
    init() {
        this.popnew = this.ui(NewPropView);
        webix.extend(this.$$("__dti"), webix.ProgressBar);
        this.$$("__dti").sync(allIs.data);
        }
    }
