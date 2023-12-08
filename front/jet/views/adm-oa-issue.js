"use strict";

import { JetView } from "webix-jet";
import { DelEdIcons, singleRefReload, setButtons, addItem, delItem, updItem, request, checkVal } from "../views/globals";


import SprOaGroupView from "../views/spr_oa_groups";
import OaCondButtonView from "../views/spr_oa_groups_cond_button";


export default class OaIssueView extends JetView {
    config() {

        var buttons_pack = {
            rows: [
                {
                    cols: [
                        {
                            view: "button", label: "Добавить группу", width: 170,
                            click: () => {
                                this.add_group()
                            },
                        },
                        {
                            view: "button", label: "Удалить группу", width: 170,
                            click: () => {
                                this.remove_group()
                            },
                        },
                    ]
                }
            ]
        }


        return {
            view: "form",
            localId: "_main_oa_form",
            width: 700,
            rows: [
                buttons_pack
                // {
                //     cols: [
                //         {
                //             view: "button", type: 'htmlbutton',
                //             tooltip: "saves",
                //             label: "<span class='webix_icon fa-plus'></span>",
                //             width: 40,
                //             localId: "_save",
                //             click: () => {
                //                 if (this.get_validate()) {
                //                     var result = this.get_value();
                //                     console.log(result);
                //                 }
                //             },
                //         },
                //         {},
                //     ]
                // }
            ]
        }
    }


    get_validate() {
        var valid = true;
        var form = this.$$("_main_oa_form");
        var childs = form.getChildViews();
        childs.forEach((child) => {
            if (child.config.is_child) {
                if (child.hasOwnProperty("$scope") && typeof child.$scope.get_validate !== 'undefined') {
                    console.log(child);
                    var child_validate = child.$scope.get_validate()
                    console.log(child_validate);
                    valid = valid & child_validate;
                }
            }
        })
        return valid;
    }

    get_value() {
        var results = [];
        var form = this.$$("_main_oa_form")
        var childs = form.getChildViews()
        childs.forEach((child) => {
            if (child.config.is_child) {
                if (child.hasOwnProperty("$scope") && typeof child.$scope.get_value !== 'undefined') {
                    var result = child.$scope.get_value();
                    results.push(result);
                    results.push()
                }
            }
        })
        return results;
    }

    parse_values(values) {
        console.log(values);
        if (values && values.hasOwnProperty("c_issue") && Array.isArray(values.c_issue)) {
            values.c_issue.forEach((to_parse_group) => {
                if (Array.isArray(to_parse_group)) {
                    this.new_group(to_parse_group);
                    // группа
                } else {
                    this.new_condition(to_parse_group);
                    //кнопка условия
                }

            })
        }
        var to_parse = [
            [
                { "value": "(" },
                { "id": 1, "value": "И" },
                { "id": 25, "value": "ГРАНУЛЫ " },
                { "id": 6, "value": "ДРАЖЕ" },
                { "value": ")" }
            ],
            {
                "id": 0, "value": "ИЛИ"
            },
            [
                { "value": "(" },
                { "id": 0, "value": "ИЛИ" },
                { "id": 17, "value": "КАПЛИ ГЛАЗНЫЕ" },
                { "id": 19, "value": "КАПЛИ ГЛАЗНЫЕ И УШНЫЕ" },
                { "value": ")" }
            ]
        ]
    }

    remove_group() {
        var form = this.$$("_main_oa_form");
        var childs = form.getChildViews();
        if (childs.length > 3) {
            var remove_childs = childs.slice(childs.length - 3, childs.length - 1);
            remove_childs.forEach((child) => {
                form.removeView(child.config.id);
            })
        }
    }

    new_condition(to_parse_group) {
        var form = this.$$("_main_oa_form");
        var childs = form.getChildViews();
        console.log(to_parse_group);
        var ii = form.addView(OaCondButtonView, childs.length - 1);
        // childs = form.getChildViews();
        var length = childs.length
        console.log(length);
        console.log(length - 2);
        var last_child = childs[length - 2].config;
        console.log(last_child.id);
        console.log($$(last_child.id).$scope);
        if (to_parse_group) $$(last_child.id).$scope.set_value(to_parse_group);
    }

    add_group() {
        this.new_condition()
        this.new_group()
    }

    new_group(preload_data) {
        var form = this.$$("_main_oa_form")
        console.log(form);
        var childs = form.getChildViews()
        form.addView(new SprOaGroupView(this.app, preload_data), childs.length - 1);
    }

    ready() {
    }

    init() {

    }
}
