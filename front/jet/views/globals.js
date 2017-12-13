"use strict";


export var prcs = new webix.DataCollection({
        id: "prcs_dc",
        on: {
            }
        });

export function get_prcs(th, supplier) {
    let user = th.app.config.user;
    supplier = 20577;
    let params = {"getPrcs": {"user": user, "supplier": supplier}};
    request(th.app.config.r_url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("prcs_dc").clearAll();
            $$("prcs_dc").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function get_suppl(view, th) {
    let user = th.app.config.user;
    let params = {"getSupplUnlnk": {"user": user}};
    request(th.app.config.r_url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$(view).getList().clearAll();
            $$(view).getList().parse(data);
            let fid = $$(view).getList().getFirstId();
            $$(view).setValue(fid)
        } else {
            webix.message('error');
            };
        })
    }

export function filter_1(item, value) {
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return item.c_vnd.toString().toLowerCase().search(value) != -1;
    }

export function request (url, params, mode) {
    var auth_key = "secret_key";
    var req = (mode === !0) ? webix.ajax().sync().headers({'x-api-key': auth_key, 'Content-type': 'application/json'}).post(url, params):
        webix.ajax().headers({'x-api-key': auth_key, 'Content-type': 'application/json'}).post(url, params)
    return req
    }

export function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : NaN;
    };

export function setCookie(name, value, options) {
    options = options || {};
    var expires = options.expires;
    if (typeof expires == "number" && expires) {
        var d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    };
    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    };
    value = encodeURIComponent(value);
    var updatedCookie = name + "=" + value;
    for (var propName in options) {
        updatedCookie += "; " + propName;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        };
    };
    document.cookie = updatedCookie;
    }

export function deleteCookie (name) {
    //var opt = {domain: location.hostname};
    setCookie(name, "", {
        'expires': -1, 'path': '/'
        })
    }



