"use strict";

import { JetView } from "webix-jet";
import { allIs, request, checkVal } from "../views/globals";
import { pluck } from "../views/globals";

import OaIssueView from "../views/adm-oa-issue";


export default class NewOaIssueView extends JetView {
    config() {
        var app = this.app;

        return {
            localId: "_new_oa_issue",
            view: "cWindow",
            modal: true,
            body: {
                view: "form",
                localId: "_n_is",
                margin: 0,
                id_spr: undefined,
                th: undefined,
                callback: undefined,
                elements: [
                    {
                        cols: [
                            {
                                view: "button", type: "base", label: "Отменить", width: 120,
                                click: () => {
                                    this.hide();
                                }
                            },
                            {},
                            {
                                view: "button", type: "base", label: "Применить", width: 120,
                                click: () => {
                                    var oa_form = this.get_oa_form();
                                    if (oa_form.get_validate()) {
                                        var result = oa_form.get_value();
                                        this.save_form(result);
                                        this.hide();
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }

    get_oa_form() {
        var form = this.$$("_n_is");
        var childs = form.getChildViews();
        return $$(childs[0].config.id).$scope
    }

    save_form(result) {
        // console.log(result);
        var value;
        let th = this.$$("_n_is").config.th;
        var value_array = []
        result.forEach(element => {
            if (Array.isArray(element)) {
                var el_array = ["("]
                var condition = ""
                console.log(element);
                if (element.length >= 4) {
                    condition = element[1].value;
                    var e = element.slice(2, -1);
                    console.log(e);
                    if (e.length > 1) {
                        var pluck_array = pluck(e, 'value');
                        console.log(pluck_array);
                        el_array.push(pluck_array.join(" " + condition + " "))
                    } else {
                        el_array.push(e[0].value)
                    }
                }
                el_array.push(")")
                value_array.push(el_array.join(" "))
            } else {
                value_array.push(element.value);
            }
            // console.log(element);
        });
        value = value_array.join(" ");

        let id_spr = this.$$("_n_is").config.id_spr;
        let callback = this.$$("_n_is").config.callback;
        let vidget_name = this.$$("_n_is").config.vidget_name || "_issue"
        // if (tgs) {
        //     let t = typeof (tgs);
        //     try {
        //         tgs.forEach(function (item, i, tgs) {
        //             p += item.c_issue + '; ';
        //             ids.push(item.id);
        //         });
        //     } catch (err) {
        //         p = tgs.c_issue;
        //         ids.push(tgs.id)
        //     }
        // }
        if (th) {
            th.$$(vidget_name).setValue(value);
            th.$$(vidget_name).current_ids = result;
            th.$$(vidget_name).refresh();
        };
        if (callback) callback(id_spr, p);

    }

    show(new_head, spr_id, th, callback, custom_url, vidget_name = "_issue") {
        var form = this.$$("_n_is");
        var childs = form.getChildViews();
        form.addView(new OaIssueView(this.app), childs.length - 1);

        let url = "getIs";
        if (custom_url) url = custom_url;
        let params = { "user": this.app.config.user, "id_spr": spr_id };
        let res = request(url, params, !0, this.app).response;
        res = checkVal(res, 's');
        var oa_form = this.get_oa_form();
        if (res.c_issue) {
            oa_form.parse_values(res);
        } else {
            oa_form.new_group();
        }
        this.$$("_n_is").config.id_spr = spr_id;
        this.$$("_n_is").config.th = th;
        this.$$("_n_is").config.callback = callback;
        this.$$("_n_is").config.vidget_name = vidget_name;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();

    }
    hide() {
        var form = this.$$("_n_is");
        var childs = form.getChildViews();
        try {
            let child_id = childs[0].config.id;
            form.removeView(child_id);
        } catch {
        };

        this.getRoot().hide()
    }
}


