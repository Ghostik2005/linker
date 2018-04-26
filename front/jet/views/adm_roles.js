"use strict";

import {JetView} from "webix-jet";
import {checkVal, request} from "../views/globals";
import ConfirmView from "../views/yes-no"

export default class RolesView extends JetView{
    config(){

        var sprv = {view: "datatable",
            localId: "__table",
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
                        //{text: "Пользователь"}
                        {text: $$("roles_dc").getItem(1).r_name}
                        ],
                    },
                { id: "linker", fillspace: 1, css: "col_center", template: "{common.checkbox()}", //template: linker_func,
                    header: [{},
                        //{text: "Сводильщик"},
                        {text: $$("roles_dc").getItem(9).r_name},
                        ],
                    },
                { id: "admin", css: "col_center", template: "{common.checkbox()}", //template: admin_func,
                    fillspace: 1, 
                    header: [{},
                        //{text: "Администратор"},
                        {text: $$("roles_dc").getItem(10).r_name},
                        ]
                    },
                { id: "superadmin", css: "col_center", template: "{common.checkbox()}", //template: superadmin_func,
                    fillspace: 1, 
                    header: [{},
                        //{text: "СуперАдмин"},
                        {text: $$("roles_dc").getItem(34).r_name},
                        ]
                    },
                { id: "qqq", css: "col_center", template: "{common.checkbox()}", //template: qqq_func,
                    fillspace: 1,
                    header: [{},
                        //{text: "qqq"},
                        {text: $$("roles_dc").getItem(35).r_name},
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
                {view:"button", type: 'htmlbutton', 
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 140,
                    on: {
                        onAfterRender: function () {
                            }
                        },
                    click: () => {
                        this.hide()
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: !this.app.config.roles[this.app.config.role].userdel,
                    label: "<span class='webix_icon fa-save'></span><span style='line-height: 20px;'> Сохранить</span>", width: 140,
                    click: () => {
                        let values = this.$$("__table").serialize();
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
                    },
                ]
            }

        var roles = {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onHide: () => {
                    this.$$("__table").clearAll();
                    },
                onShow: () => {
                    let url = this.app.config.r_url + "?getAdmRoles";
                    let params = {"user": this.app.config.user};
                    request(url, params).then(function(data) {
                        data = checkVal(data, 'a');
                        if (data) {
                            this.$scope.$$("__table").parse(data)
                        } else {
                            this.$scope.$$("__table").clearAll();
                            };
                        this.$scope.$$("__table").hideProgress();
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
