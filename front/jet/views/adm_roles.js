"use strict";

import {JetView} from "webix-jet";
import {checkVal, request} from "../views/globals";
import ConfirmView from "../views/yes-no"

export default class RolesView extends JetView{
    config(){

        var sprv = {view: "datatable",
            name: "_roles",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            css: 'dt_css',
            columns: [
                {id: "act_name", width: 375, 
                    header: [{text: "Тип действия"},
                        ],
                    },
                {id: "user", fillspace: 1, css: "col_center", template: "{common.checkbox()}", 
                    header: [{text: "Имя роли", colspan: 5, css: "col_center"},
                        {text: $$("roles_dc").getItem(1).r_name}
                        ],
                    },
                { id: "linker", fillspace: 1, css: "col_center", template: "{common.checkbox()}", 
                    header: [{},
                        {text: $$("roles_dc").getItem(9).r_name},
                        ],
                    },
                { id: "admin", css: "col_center", template: "{common.checkbox()}", 
                    fillspace: 1, 
                    header: [{},
                        {text: $$("roles_dc").getItem(10).r_name},
                        ]
                    },
                { id: "superadmin", css: "col_center", template: "{common.checkbox()}", 
                    fillspace: 1, 
                    header: [{},
                        {text: $$("roles_dc").getItem(34).r_name},
                        ]
                    },
                { id: "qqq", css: "col_center", template: "{common.checkbox()}", 
                    fillspace: 1,
                    header: [{},
                        {text: $$("roles_dc").getItem(35).r_name},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                }
            }

        var top = {height: 40, view: "toolbar",
            cols: [
                {},
                {view:"button", type: 'htmlbutton', 
                    label: "<span class='webix_icon fa-times'></span><span style='line-height: 20px;'> Отменить</span>", width: 140,
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
                    let th = this;
                    let url = this.app.config.r_url + "?getAdmRoles";
                    let params = {"user": this.app.config.user};
                    request(url, params).then(function(data) {
                        data = checkVal(data, 'a');
                        if (data) {
                            th.$$("__table").parse(data);
                        } else {
                            th.$$("__table").clearAll();
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
