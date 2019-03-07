"use strict";

export var user_inn_w = new webix.DataCollection({
});

export var user_inn_u = new webix.DataCollection({
});

export function checkKey(code) {
    let ret = false;
    if (code === 8 || code === 13 || code === 32 || code === 46 || (code > 47 && code < 91) || (code > 95 && code < 112) || (code > 185 && code < 193) || (code > 219 && code < 223)) ret = true;
    return ret
    }

export function checkVal(result, mode) {
    var ret_value;
    var err;
    if (mode === 's') {
        ret_value = JSON.parse(result);
    } else if (mode === 'a') {
        ret_value = result.json();
        };
    if (ret_value.result) {
        ret_value = ret_value.ret_val;
    } else {
        ret_value = undefined;
        err = 'error';
        }
    return ret_value;
    }

export function str_join(obj) {
    let ret = ''
    for (var k in obj) {
        let val = obj[k];
        if (typeof(val) === 'object') {
            val = str_join(val)
        } else {
            ret += val.toString()
            }
        }
    return ret
    }
    
export function getDtParams(ui) {
    let c_filter;
    if (ui.config.name === "_spr") {
    }
    return [c_filter, ui.config.posPpage, ui.config.fi, ui.config.di]
}

export function clear_obj(obj) {
    for (var k in obj) {
        let val = obj[k];
        if (typeof(val) === 'object') {
            val = clear_obj(val)
        } else {
            if (val==undefined) {
                delete obj[k];
            }
        }
    }
    return obj
}

export function gen_params(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    let se_s = inp_params.searchBar;
    let field = (inp_params.field) ? inp_params.field : undefined;
    let direction = (inp_params.direction) ? inp_params.direction : undefined;
    let search_str = (se_s) ? view.$scope.$$(se_s).getValue() : undefined;
    let c_filter = (inp_params.filter) ? inp_params.filter : undefined;
    let user = app.config.user;
    let params = {"user": user, "search": search_str, "start": inp_params.start, "count": inp_params.count,
                  "field": field, "direction": direction, "c_filter": c_filter, "cbars": inp_params.cbars};
    params = clear_obj(params);
    return params
}

export function get_data_test(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    if (view) view.clearAll();
    let nav = inp_params.navBar;
    let url = app.config.r_url + "?" + inp_params.method;
    let params = gen_params(inp_params);
    let search_str = params.search;
    let plus = undefined;
    if (search_str.indexOf("+") != -1) {
        search_str = search_str.replace('+', '+++++')
    }
    if (search_str === "") search_str="%%";
    let rl = (typeof search_str !== "undefined") ? search_str.replace(/\ /g, "").length : 2;
    let sl = (typeof search_str !== "undefined") ? search_str.length : 2;
    if (sl > 1 && rl > 1) {
        //view.disable();
        view.showProgress({
            //type: "icon",
            type: "top",
            });
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                if (data.params) {
                    let c_params = str_join(gen_params(inp_params));
                    let r_params = str_join(data['params']);
                    if (r_params !== c_params) {
                        view.enable();
                        view.hideProgress();
                        return
                    }
                }
                view.parse(data.datas);
                view.config.startPos = data.start;
                view.config.totalPos = data.total;
                let total_page = Math.ceil(view.config.totalPos / view.config.posPpage);
                let c_page = (total_page !== 0) ? Math.ceil(view.config.startPos / view.config.posPpage) : 1;
                let pa = nav.getChildViews()[3]
                let co = nav.getChildViews()[7]
                co.define('label', "<span style='font-size: smaller'>Всего записей: " + view.config.totalPos + "</span>");
                co.refresh();
                let old_p = nav.$scope.$$("__page").getValue()
                try {
                    old_p = +old_p;
                } catch (ee) {
                };
                if (old_p !==c_page) nav.$scope.$$("__page").config.manual = false;
                let pa1 = pa.getChildViews();
                pa1[2].define('label', "<span style='font-size: smaller'>" + total_page + "</span>");
                pa1[2].refresh();
                nav.$scope.$$("__page").setValue(c_page);
                nav.$scope.$$("__page").refresh();
                let hist = webix.storage.session.get(view.config.name);
                if (hist) {
                    if (search_str !== "%%") hist.push(search_str);
                } else {
                    let ssstr = (search_str !== "%%") ? search_str : ''
                    hist = [ssstr,]
                }
                webix.storage.session.put(view.config.name, hist);
            };
            view.enable();
            view.hideProgress();
        });
    } else {
        };
 
}
    
export function init_first(app) {

    webix.i18n.setLocale('ru-RU');
        
    webix.protoUI({
        name: "cWindow",
        defaults: {
            resize: true,
            modal: false,
            move: true,
            position: "center"
        },
        $init: function(config){
            webix.extend(config, {
                head: {
                    view: "toolbar",
                    cols: [
                        {view: "label", label: "Название окна"},
                        {view: "button",
                            tooltip: "Закрыть",
                            css: "custom_button",
                            type:"imageButton", image: './library/img/close-cross.svg',
                            //type: "htmlbutton",
                            //label: "<span class='webix_icon fas fa-times'></span>",
                            //css: "times",
                            height: 26,
                            width:40,
                            click: function () {
                                this.getTopParentView().hide();
                            }
                        }
                    ]
                }
            })
        }
    }, webix.ui.window);
}

export function after_call(text, data, XmlHttpRequest) {
    var status = XmlHttpRequest.status;
    if (status == 403) {
        deleteCookie("merge3-app");
        location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/merge3/";
    };
}

export function after_call_s(text, data, XmlHttpRequest) {
    // console.log('headers', XmlHttpRequest.getAllResponseHeaders());
    }

export function request (url, params, mode) {
    var req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params, {success: after_call_s, error: after_call})
                        : webix.ajax().timeout(90000).headers({'Content-type': 'application/json'}).post(url, params, {success: after_call_s, error: after_call})
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
    setCookie(name, "", {
        'expires': -1, 'path': '/'
    })
}

export function dt_format(d) {
    return webix.Date.dateToStr("%d-%m-%Y")(d)
};

export function unique_arr(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        var str = arr[i];
        obj[str] = true; // запомнить строку в виде свойства объекта
    };
    return Object.keys(obj); // или собрать ключи перебором для IE8-
};

export function insert_inns(active_label, insert) {
    let tooltip = [];
    if (insert.length === 0) {
        insert = "";
    } else if (insert.length === 1){
        insert = insert[0]
    } else {
        if (insert.length > 4) {
            tooltip = insert.slice(4, insert.length);
            insert = insert.slice(0, 4);
            insert.push("<span style='color: red'>  а также...</span>");
        } else {                    
        };
        insert = insert.join(', ');
        tooltip = tooltip.join(', ');
    };
    active_label.define({'label': insert, 'tooltip': tooltip});
    active_label.refresh();
}

export var onExit = function (app) {
    let x;
    let user = getCookie('merge3-app');
    // deleteCookie(app.config.sklad_cook);
    //включить когда все будет готово
    // deleteCookie("merge3-app");
    if (user) {
        [user, x] = user.split('::');
        let url = app.config.r_url + "?setExit";
        let params = {"user":user};
        if (app.debug) {
            request(url, params);
        }
    }

}