"use strict";

import {JetView} from "webix-jet";
import {get_spr} from "../views/globals";
import {get_data, adm_roles, checkVal, request} from "../views/globals";
import {last_page, get_bars} from "../views/globals";
import ConfirmView from "../views/yes-no"

export default class RolesView extends JetView{
    config(){

        var sprv = {view: "datatable",
            id: "__dt_r",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //headermenu:true,
            css: 'dt_css',
            columns: [
                {id: "act_name", width: 375, //css: "col_center",
                    header: [{text: "Тип действия"},
                        ],
                    },
                {id: "user", fillspace: 1, css: "col_center", template: "{common.checkbox()}", //template: user_func,
                    header: [{text: "Имя роли", colspan: 5, css: "col_center"},
                        {text: "Пользователь"}
                        ],
                    },
                { id: "linker", fillspace: 1, css: "col_center", template: "{common.checkbox()}", //template: linker_func,
                    header: [{},
                        {text: "Сводильщик"},
                        ],
                    },
                { id: "admin", css: "col_center", template: "{common.checkbox()}", //template: admin_func,
                    fillspace: 1, 
                    header: [{},
                        {text: "Администратор"},
                        ]
                    },
                { id: "superadmin", css: "col_center", template: "{common.checkbox()}", //template: superadmin_func,
                    fillspace: 1, 
                    header: [{},
                        {text: "СуперАдмин"},
                        ]
                    },
                { id: "qqq", css: "col_center", template: "{common.checkbox()}", //template: qqq_func,
                    fillspace: 1,
                    header: [{},
                        {text: "qqq"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeSort: (field, direction) => {
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: function(item) {
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    },
                }
            }

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {},
                {view:"button", type: 'htmlbutton', disabled: !true,
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 140,
                    on: {
                        onAfterRender: function () {
                            }
                        },
                    click: () => {
                        this.hide()
                        }
                    },
                (this.app.config.roles[this.app.config.role].userdel) ? {view:"button", type: 'htmlbutton', disabled: true, 
                    label: "<span class='webix_icon fa-save'></span><span style='line-height: 20px;'> Сохранить</span>", width: 140,
                    on: {
                        onAfterRender: function () {
                            if (this.$scope.app.config.roles[this.$scope.app.config.role].userdel) this.enable();
                            }
                        },
                    click: () => {
                        webix.message({
                            text: "Сохраниние ролей. Позже.",
                            type: "debug",
                            })
                        let values = $$("__dt_r").serialize();
                        let url = this.app.config.r_url + "?setAdmRoles"
                        let params = {"user": this.app.config.user, "values": values};
                        let res = checkVal(request(url, params, !0).response, 's');
                        if (res) {
                            let params = {};
                            params["command"] = "?killAll";
                            params["type"] = "async";
                            params['action'] = res;
                            this.popconfirm.show('Отключить всех пользователей?', params);
                            this.hide()
                            }

                        }
                    } : {width: 1},
                ]
            }

        var roles = {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onHide: () => {
                    $$("__dt_r").clearAll();
                    },
                onShow: () => {
                    let url = this.app.config.r_url + "?getAdmRoles";
                    let params = {"user": this.app.config.user};
                    request(url, params).then(function(data) {
                        data = checkVal(data, 'a');
                        if (data) {
                            $$("__dt_r").parse(data)
                            //$$("__dt_r").refresh()
                        } else {
                            $$("__dt_r").clearAll();
                            };
                        $$("__dt_r").hideProgress();
                        });
                    }
                },
            body: {
                view: "layout",
                rows: [
                top,
                sprv
                    ]
                }
            }

        return roles
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
        
    init() {
        this.popconfirm = this.ui(ConfirmView);
        }

    hide(){
        this.getRoot().hide()
        }
    }
