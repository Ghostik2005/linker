# coding: utf-8

import datetime
import glob
import hashlib
import io
import json
import os
import subprocess
import time
import traceback
import uuid
from multiprocessing.dummy import Pool as ThreadPool

import libs.ods as ods
import libs.xlsx as xlsx
from libs.connect import pg_local
from libs.dbfread import DBF
from libs.openpyxl import load_workbook

import psycopg2

import requests

import xlrd


class API:
    """
    API class for http post access
    x_hash - API key
    """

    def __init__(
        self,
        app_conf,
        w_path="/ms71/data/linker",
        p_path="/ms71/data/linker/api-k",
        pg=False,
        production=False,
    ):
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        self.app_conf = app_conf
        if not self.app_conf.get("debug") or self.app_conf.get("debug") is False:
            if not os.path.exists(self.path):
                os.makedirs(self.path, mode=0o777)
            if not os.path.exists(self.p_path):
                os.makedirs(self.p_path, mode=0o777)
        self.log = self.app_conf["log"]
        self.db = pg_local(
            self.log,
            udp=self.app_conf["udpsock"],
            pg_conn=pg,
            production=production,
        )
        self.start = 1
        self.count = 20
        self._insLimit = lambda start_p, end_p: f""" limit {end_p - start_p + 1} offset {start_p-1}"""

    def _print(self, t):
        if self.db.production is False:
            print("-" * 20)
            print(t)
            print("-" * 20)

    def _setStr(self, opt=None, type=str):
        return type(opt) if opt else ("" if type == str else 0)

    def setSkladErrorLnk(self, params=None, x_hash=None):

        try:
            inserts = []
            s = params.get("sh_prc")
            inserts.append(self._setStr(s))
            s = params.get("sklad_name")
            inserts.append(self._setStr(s))
            s = params.get("sklad_user")
            inserts.append(self._setStr(s))
            s = params.get("id_spr")
            inserts.append(self._setStr(s, int))
            s = params.get("sklad_c_tovar")
            inserts.append(self._setStr(s))
            s = params.get("sklad_id_tovar")
            inserts.append(self._setStr(s))
            s = params.get("sklad_c_zavod")
            inserts.append(self._setStr(s))
            s = params.get("sklad_c_strana")
            inserts.append(self._setStr(s))
            s = params.get("id_vnd")
            inserts.append(self._setStr(s, int))
            s = params.get("vnd_c_tovar")
            inserts.append(self._setStr(s))
            s = params.get("vnd_id_tovar")
            inserts.append(self._setStr(s))
            s = params.get("vnd_c_zavod")
            inserts.append(self._setStr(s))
            s = params.get("vnd_c_strana")
            inserts.append(self._setStr(s))
            s = params.get("id_user", 0)
            inserts.append(self._setStr(s, int))
            s = params.get("nakl")
            inserts.append(self._setStr(s))
        except Exception:
            self.log(f"{traceback.format_exc()}")
            ret = {"result": False, "ret_val": "Non-correct data"}
        else:
            inserts = tuple(inserts)
            sql = f"""insert into lnk_errors_from_sklad (sh_prc, sklad_name, sklad_user, id_spr,
sklad_c_tovar, sklad_id_tovar, sklad_c_zavod, sklad_c_strana, id_vnd, vnd_c_tovar, vnd_id_tovar,
vnd_c_zavod, vnd_c_strana, user_id, nakl) values {str(inserts)} returning id; """
            # self._print(sql)
            result = self.db.execute({"sql": sql, "options": None})
            if result:
                ret = {"result": True, "ret_val": "Inserted"}
            else:
                ret = {"result": False, "ret_val": "Not inserted"}
        finally:
            return json.dumps(ret, ensure_ascii=False)

    def setExit(self, params=None, x_hash=None):
        user = params.get("user")
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            self._setUnwork(user)
            ret = {"result": True, "ret_val": "OK"}
        return json.dumps(ret, ensure_ascii=False)

    def login(self, params=None, x_hash=None):
        user = params.get("user")
        p_hash = params.get("pass")
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            sql = """select r."USER", r.PASSWD, r.ID_ROLE, r.EXPERT FROM USERS r where lower(r."USER") = lower(%s)"""
            opt = (user,)
            res = self.db.request({"sql": sql, "options": opt})
            if len(res) > 0:
                md = hashlib.md5()
                md.update(res[0][1].encode())
                if md.hexdigest() == p_hash:
                    k_list = glob.glob(os.path.join(self.p_path, "*"))
                    for f_name in k_list:
                        with open(f_name, "rb") as f_obj:
                            fuser = f_obj.read().decode().strip()
                        if fuser.lower() == user.lower():
                            os.remove(f_name)
                            # break
                    a_key = uuid.uuid4().hex
                    f_name = os.path.join(self.p_path, a_key)
                    with open(f_name, "wb") as f_obj:
                        f_obj.write(res[0][0].encode())
                    ret = {
                        "result": True,
                        "ret_val": {
                            "key": a_key,
                            "role": str(res[0][2]),
                            "expert": str(res[0][3]),
                            "user": str(res[0][0]),
                        },
                    }
        return json.dumps(ret, ensure_ascii=False)

    def setExpert(self, params=None, x_hash=None):
        user = params.get("user")
        expert = params.get("expert", 5)
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            sql = """update USERS set EXPERT = %s where "USER" = %s"""
            opt = (expert, user)
            self.db.execute({"sql": sql, "options": opt})
            ret = {"result": True, "ret_val": "ok"}
        return json.dumps(ret, ensure_ascii=False)

    def saveParams(self, params=None, x_hash=None):
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            pars = params.get("pars")
            user = params.get("user")
            pars = json.dumps(pars, ensure_ascii=False)
            if user:
                ppprs = psycopg2.Binary(pars.encode())
                sql = """update USERS set PARAMS = %s where "USER" = %s"""
                opt = (ppprs, user)
                self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": "saved"}
            else:
                ret = {"result": False, "ret_val": "No user"}
        return json.dumps(ret, ensure_ascii=False)

    def getVersion(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            opt = (user,)
            # сбрасываем все настройки в работе - заплатка, пока нет функции харт-бита в приложении
            self._setUnwork(user)
            sql = """select r.EXPERT, r.PARAMS, r."GROUP" FROM USERS r where r."USER" = %s"""
            expert, pars, gr = self.db.request({"sql": sql, "options": opt})[0]
            try:
                pars = pars.tobytes()
                pars = pars.decode()
            except Exception:
                pass
            expert = str(expert)
            try:
                pars = str(pars.decode())
            except Exception:
                pass
            prod = {"version": self.log.version, "prod": self.db.production}
            sql = """SELECT r.ID_ROLE, r.SKIPPED, r.SPRADD, r.SPREDIT, r.ADM, r.VENDORADD, r.USERADD, r.USERDEL, r.LNKDEL FROM SPR_ROLES r"""
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            r = {}
            for row in res:
                r[row[0]] = {
                    "skipped": row[1] == 1,
                    "spradd": row[2] == 1,
                    "spredit": row[3] == 1,
                    "adm": row[4] == 1,
                    "vendoradd": row[5] == 1,
                    "useradd": row[6] == 1,
                    "userdel": row[7] == 1,
                    "lnkdel": row[8] == 1,
                }
            ret_v = {
                "info": prod,
                "cfg": r,
                "expert": expert,
                "params": pars,
                "group": gr,
            }
            ret = {"result": True, "ret_val": ret_v}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def killAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            action = params.get("action")
            sql = """SELECT r."USER" from USERS r WHERE r.ID_ROLE in (%s)""" % (",".join([str(a) for a in action]))
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            users = []
            for row in res:
                users.append(row[0])
            k_list = glob.glob(os.path.join(self.p_path, "*"))
            for f_name in k_list:
                if "x_login" in f_name:
                    continue
                with open(f_name, "rb") as f_obj:
                    fuser = f_obj.read().decode().strip()
                if fuser in users:
                    try:
                        os.remove(f_name)
                    except Exception:
                        pass
            ret = {"result": True, "ret_val": True}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setAdmRoles(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            values = params.get("values")
            if values:
                # меняем местами столбцы и строки
                datas = {}
                for val in values:
                    upd = {
                        "user": val.get("user"),
                        "admin": val.get("admin"),
                        "linker": val.get("linker"),
                        "superadmin": val.get("superadmin"),
                        "qqq": val.get("qqq"),
                    }
                    datas[val.get("id")] = upd
                rrr = {
                    "user": {},
                    "admin": {},
                    "superadmin": {},
                    "qqq": {},
                    "linker": {},
                }
                for k in datas.keys():
                    kv = datas.get(k)
                    for kk in kv.keys():
                        item = {k: kv.get(kk)}
                        rrr[kk].update(item)
                opt = []
                for k in rrr:
                    v = rrr.get(k)
                    opt_l = [
                        1 if v.get("skipped") or v.get("skipped") == 1 else 0,
                        1 if v.get("spradd") or v.get("spradd") == 1 else 0,
                        1 if v.get("spredit") or v.get("spredit") == 1 else 0,
                        1 if v.get("adm") or v.get("adm") == 1 else 0,
                        1 if v.get("vendoradd") or v.get("vendoradd") == 1 else 0,
                        1 if v.get("useradd") or v.get("useradd") == 1 else 0,
                        1 if v.get("userdel") or v.get("userdel") == 1 else 0,
                        1 if v.get("lnkdel") or v.get("lnkdel") == 1 else 0,
                        k,
                    ]
                    opt.append(opt_l)
                sql = """update SPR_ROLES SET SKIPPED = %s, SPRADD = %s,
SPREDIT = %s, ADM = %s, VENDORADD = %s,
USERADD = %s, USERDEL = %s, LNKDEL = %s where N_ROLE = %s returning ID_ROLE"""
                re = []
                for op in opt:
                    o = op.pop()
                    sql_e = """select SKIPPED, SPRADD, SPREDIT, ADM, VENDORADD, USERADD, USERDEL, LNKDEL from SPR_ROLES where n_role = %s"""
                    r1 = self.db.execute({"sql": sql_e, "options": (o,)})
                    r1 = r1[0]
                    if tuple(op) == r1:
                        continue
                    op.append(o)
                    res = self.db.execute({"sql": sql, "options": tuple(op)})
                    if res:
                        re.append(res[0][0])
                ret = {"result": True, "ret_val": re}
            else:
                ret = {"result": False, "ret_val": "обновлять нечего"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTasks(self, params=None, x_hash=None):
        if self._check(x_hash):
            _return = []
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getAdmRoles(self, params=None, x_hash=None):
        descr = {
            "skipped": "Просмотр пропущенных",
            "spradd": "Добавление в справочник",
            "adm": "Администрирование",
            "spredit": "Редактирование справочника",
            "useradd": "Добавление пользователей",
            "userdel": "Удаление пользователей",
            "lnkdel": "Удаление связок",
            "vendoradd": "Добавление производителей",
        }
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.N_ROLE, r.SKIPPED, r.SPRADD, r.SPREDIT, r.ADM, r.VENDORADD, r.USERADD, r.USERDEL, r.LNKDEL FROM SPR_ROLES r"""
            opt = ()
            res = self.db.execute({"sql": sql, "options": opt})
            r = {
                "skipped": {},
                "spradd": {},
                "adm": {},
                "spredit": {},
                "useradd": {},
                "userdel": {},
                "lnkdel": {},
                "vendoradd": {},
            }
            for row in res:
                name = row[0]
                r["skipped"].update({name: row[1] == 1})
                r["spradd"].update({name: row[2] == 1})
                r["spredit"].update({name: row[3] == 1})
                r["adm"].update({name: row[4] == 1})
                r["vendoradd"].update({name: row[5] == 1})
                r["useradd"].update({name: row[6] == 1})
                r["userdel"].update({name: row[7] == 1})
                r["lnkdel"].update({name: row[8] == 1})
            rr = []
            for k in r.keys():
                kv = r.get(k)
                rrr = {"act_name": descr.get(k), "id": k}
                for kk in kv.keys():
                    item = {kk: kv.get(kk)}
                    rrr.update(item)
                rr.append(rrr)
            ret = {"result": True, "ret_val": rr}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsItem(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get("sh_prc")
            sql = """
select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, u."USER", v.C_VND
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
INNER JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.SH_PRC = %s
            """
            opt = (sh_prc,)
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                    "c_user": row[9],
                    "c_vnd": row[10],
                }
                _return.append(r)

            ret = {
                "result": True,
                "ret_val": {"datas": _return[0], "params": params},
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def copyPrc(self, params=None, x_hash=None):
        if self._check(x_hash):
            value = params.get("value")
            sh_prc = params.get("sh_prc")
            series = None
            if value and sh_prc:
                sql = """select r.sh_prc, r.id_vnd, r.id_tovar, r.n_fg, r.n_cena, r.c_tovar, r.c_zavod, r.id_org, r.c_index,
r.dt, r.in_work, r.source, r.uin
from prc r
WHERE r.SH_PRC = %s"""
                opt = (sh_prc,)
                row = None
                result = self.db.request({"sql": sql, "options": opt})
                row = result[0]
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                    "dt": row[9],
                    "in_work": row[10],
                    "source": row[11],
                    "uin": row[12],
                }
                if row:
                    if r["id_vnd"] == 10000:
                        sql = f"select series, dt from brak where sh_prc = '{sh_prc}';"
                        series, dt = self.db.request({"sql": sql, "options": ()})[0]
                    row = tuple(row)
                    opts = []
                    new_brak = []
                    for i in range(value):
                        new_opt = list(row)
                        new_opt[5] = new_opt[5] + f"_дубль_{i+1}"
                        new_opt[0] = self._genHash(new_opt[1], new_opt[5], new_opt[6])
                        opts.append(tuple(new_opt))
                        if series:
                            new_brak.append((series, new_opt[0], dt))
                    sql = """insert into prc (sh_prc, id_vnd, id_tovar, n_fg, n_cena, c_tovar, c_zavod, id_org, c_index,
dt, in_work, source, uin, change_dt) values
(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, current_timestamp);"""
                    self.db.executemany({"sql": sql, "options": opts})
                    if series:
                        sql_s = """insert into brak (series, sh_prc, dt) values (%s, %s, %s)"""
                        self.db.executemany({"sql": sql_s, "options": new_brak})

                    ret = {"result": True, "ret_val": "applied"}
                else:
                    ret = {
                        "result": False,
                        "ret_val": "no data with this sh_prc",
                    }
            else:
                ret = {"result": False, "ret_val": "no parameters"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updErrorFromSkladStatus(self, params=None, x_hash=None):
        if self._check(x_hash):
            item_id = params.get("id")
            new_status = params.get("status")
            if item_id and new_status:
                sql = """update lnk_errors_from_sklad set status = %s, change_dt=current_timestamp where id = %s returning change_dt"""
                opt = (new_status, item_id)
                result = self.db.execute({"sql": sql, "options": opt})
                if result:
                    ret = {"result": True, "ret_val": str(result[0][0])}
                else:
                    ret = {"result": False, "ret_val": "update error"}
            else:
                ret = {"result": False, "ret_val": "no data"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getErrorsFromSklad(self, params=None, x_hash=None):
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "dt")
            if field == "c_vnd":
                field = "v." + field
            else:
                field = "r." + field
            direction = params.get("direction", "desc")
            search_re = params.get("search", "")
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "(lower(r.sklad_c_tovar) like lower('%%') or lower(r.vnd_c_tovar) like lower('%%'))"
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                ts1 = (
                    "(lower(r.sklad_c_tovar) like lower('%"
                    + search_re[i].strip()
                    + "%') or lower(r.vnd_c_tovar) like lower('%"
                    + search_re[i].strip()
                    + "%'))"
                )
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            filt = params.get("c_filter")
            status = filt.get("status")
            dt = filt.get("dt")
            if status:
                stri.insert(0, f"r.status = {int(status)} and")
            if dt:
                start_dt = dt.get("start")
                end_dt = dt.get("end")
                if start_dt and not end_dt:
                    start_dt = start_dt.split()[0]
                    s = """(r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                    stri.insert(0, "%s and" % s.format(start_dt))
                elif start_dt and end_dt:
                    end_dt = end_dt.split()[0]
                    s = """ (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                    stri.insert(0, "%s and" % s.format(start_dt, end_dt))

            sql = f"""select r.id, r.sh_prc, r.sklad_name, r.sklad_user, r.id_spr, r.sklad_c_tovar, r.sklad_id_tovar,
r.sklad_c_zavod, r.sklad_c_strana, r.id_vnd, v.c_vnd,
r.vnd_c_tovar, r.vnd_id_tovar, r.vnd_c_zavod,  r.vnd_c_strana,
r.status, r.dt, r.change_dt, r.nakl
from lnk_errors_from_sklad r
left join vnd v on v.id_vnd = r.id_vnd
WHERE {' '.join(stri)}
"""
            sql_c = f"""select count(*)
from lnk_errors_from_sklad r
left join vnd v on v.id_vnd = r.id_vnd
WHERE {' '.join(stri)}"""
            sql += f"""order by {field} {direction}"""
            sql += self._insLimit(start_p, end_p)
            sql = sql.replace(
                "WHERE (lower(r.sklad_c_tovar) like lower('%%%%') or lower(r.vnd_c_tovar) like lower('%%%%'))",
                "",
            )
            if len(stri) > 0:
                sql = sql.replace(
                    "WHERE (lower(r.sklad_c_tovar) like lower('%%') or lower(r.vnd_c_tovar) like lower('%%'))",
                    "",
                )
                sql_c = sql_c.replace(
                    "WHERE (lower(r.sklad_c_tovar) like lower('%%') or lower(r.vnd_c_tovar) like lower('%%'))",
                    "",
                )
            _return = []
            p_list = (
                [
                    {"sql": sql, "opt": ()},
                ]
                if total_table
                else [{"sql": sql, "opt": ()}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                r = {
                    "id": row[0],
                    "sh_prc": row[1],
                    "sklad_name": row[2],
                    "sklad_user": row[3],
                    "id_spr": row[4],
                    "sklad_c_tovar": row[5],
                    "sklad_id_tovar": row[6],
                    "sklad_c_zavod": row[7],
                    "sklad_c_strana": row[8],
                    "id_vnd": row[9],
                    "c_vnd": row[10],
                    "vnd_c_tovar": row[11],
                    "vnd_id_tovar": row[12],
                    "vnd_c_zavod": row[13],
                    "vnd_c_strana": row[14],
                    "status": row[15],
                    "dt": str(row[16]),
                    "change_dt": str(row[17]),
                    "nakl": str(row[18]),
                }
                _return.append(r)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            total_table = params.get("total")
            filt = params.get("c_filter")
            stri = ""
            c_tov = params.get("search", "")
            zavod = None
            # user = params.get("user")
            if "+" in c_tov:
                s = c_tov.split("+")
                c_tov = s[0]
                zavod = s[1]
            if filt:
                pars = {}
                pars["c_vnd"] = filt.get("c_vnd")
                pars["c_zavod"] = zavod or filt.get("c_zavod")
                pars["c_tovar"] = filt.get("c_tovar", c_tov)
                pars["c_user"] = filt.get("c_user")
                pars["source"] = filt.get("source")
                pars["id_org"] = filt.get("id_org")
                pars["sh_prc"] = filt.get("sh_prc")
                pars["id_tovar"] = filt.get("id_tovar")

                ssss = []
                us_s = ""
                v_s = ""
                if pars["c_vnd"]:
                    s = "v.ID_VND in ({0})".format(pars["c_vnd"])
                    v_s = "and %s" % s
                if pars["c_user"]:
                    if pars["c_user"] == "Не назначен":
                        s = "ru.name is null"
                    else:
                        s = "ru.name = '" + pars["c_user"] + "'"
                    us_s = "and %s" % s
                if pars["c_tovar"]:
                    sti = "lower(r.C_TOVAR) like lower('%%')"
                    pars["c_tovar"] = pars["c_tovar"].split()
                    s = (
                        []
                        if len(pars["c_tovar"]) > 0
                        else [
                            sti,
                        ]
                    )
                    for i in range(len(pars["c_tovar"])):
                        ts1 = "lower(r.C_TOVAR) like lower('%" + pars["c_tovar"][i].strip() + "%')"
                        if i == 0:
                            s.append(ts1)
                        else:
                            s.append("and %s" % ts1)
                    s = " ".join(s)
                    ssss.append("and %s" % s)
                if pars["id_tovar"]:
                    if pars["id_tovar"].endswith(" "):
                        pars["id_tovar"] = pars["id_tovar"].strip()
                        s = f"lower(r.id_tovar)  = lower('{pars['id_tovar']}')"
                    else:
                        s = "lower(r.id_tovar) like lower('%" + pars["id_tovar"] + "%')"
                    ssss.append("and %s" % s)
                if pars["sh_prc"]:
                    s = "r.sh_prc like lower('%" + pars["sh_prc"] + "%')"
                    ssss.append("and %s" % s)
                if pars["id_org"]:
                    s = f"""cast(r.id_org as text) like ('{pars['id_org']}%')"""
                    ssss.append("and %s" % s)
                if pars["c_zavod"]:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars["c_zavod"] + "%')"
                    ssss.append("and %s" % s)
                if pars["source"]:
                    if 0 == int(pars["source"]):
                        s = "(r.SOURCE is null or r.SOURCE = 0)"
                    else:
                        s = "r.SOURCE = " + pars["source"]
                    ssss.append("and %s" % s)
                dt = filt.get("dt")
                if dt:
                    pars["start_dt"] = dt.get("start")
                    pars["end_dt"] = dt.get("end")
                    if pars["start_dt"] and not pars["end_dt"]:
                        pars["start_dt"] = pars["start_dt"].split()[0]
                        s = """(r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ssss.append("and %s" % s.format(pars["start_dt"]))
                    elif pars["start_dt"] and pars["end_dt"]:
                        pars["end_dt"] = pars["end_dt"].split()[0]
                        s = """ (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ssss.append("and %s" % s.format(pars["start_dt"], pars["end_dt"]))
                stri = " ".join(ssss)
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "dt")
            direction = params.get("direction", "desc")
            us_stri = ""
            table = "r."
            if field == "c_vnd":
                table = "v."
            elif field == "c_user":
                table = "ru."
                field = "name"
            elif field == "dt":
                table = ""
                field = "ch_date"
            field = "".join([table, field])
            order = "order by {0} {1}".format(field, direction)
            sql_1 = (
                """left join (select DISTINCT  u."GROUP" ug, u.ID_ROLE uid from USERS u) as ddd1 on ug = r.ID_ORG"""
            )
            sql_2 = (
                """left JOIN VND v on (r.ID_VND = v.ID_VND)"""
                if not v_s
                else """JOIN VND v on (r.ID_VND = v.ID_VND) %s""" % v_s
            )
            sql_3 = """left join ROLES ru on uid = ru.ID"""
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, 0, v.C_VND, r.dt ch_date,
        CASE
            WHEN ru.NAME is NULL THEN 'не назначен'
            ELSE ru.NAME
        END ruu,
        r.SOURCE,
        r.in_work,
        uu."USER",
        ru.id
    from (select r.sh_prc rsh from PRC r WHERE r.n_fg <> 1 {order if 'r.' in order else ''}) as sss1
    join prc r on r.SH_PRC = rsh
    {sql_2}
    {sql_1}
    {sql_3}
    left join users uu on uu.id = r.in_work
    {order if 'r.' not in order else ''}"""
            sql_ = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, 0, v.C_VND, r.dt ch_date,
        CASE
            WHEN ru.NAME is NULL THEN 'не назначен'
            ELSE ru.NAME
        END ruu,
        r.SOURCE,
        r.in_work,
        uu."USER",
        ru.id
    from prc r
    {sql_2}
    {sql_1}
    {sql_3}
    left join users uu on uu.id = r.in_work
    WHERE r.n_fg <> 1 {stri} {us_stri} {us_s or ''}
    order by {field} {direction}"""
            sql = sql_ if (stri or us_stri or us_s) else sql
            sql_tt = sql
            sql_c = f"""select count(*) from ({sql_tt})"""
            sql = sql + self._insLimit(start_p, end_p)
            _return = []
            sql_c = f"""select count(r.SH_PRC) from  PRC r
    {sql_2 if v_s else ''}
    {sql_1 if us_s else ''}
    {sql_3 if us_s else ''}
    left join users uu on uu.id = r.in_work
    WHERE r.n_fg <> 1 {stri} {us_s or ''}"""

            self.log(sql)
            p_list = (
                [
                    {"sql": sql, "opt": ()},
                ]
                if total_table
                else [{"sql": sql, "opt": ()}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                if str(row[13]) == "1":
                    sou = "PLExpert"
                elif str(row[13]) == "2":
                    sou = "Склад"
                elif str(row[13]) == "3":
                    sou = "Агент"
                elif str(row[13]) == "4":
                    sou = "edocs"
                else:
                    sou = "Без источника"
                if row[15] is None:
                    w_name = ""
                else:
                    w_name = str(row[15])
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                    "c_user": row[12],
                    "c_vnd": row[10],
                    "dt": str(row[11]),
                    "source": sou,
                    "in_work": str(row[14]),
                    "in_work_name": w_name,
                    "role": str(row[16]),
                }
                _return.append(r)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsProcess(self, params=None, x_hash=None):
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            direction = params.get("direction", "asc")
            user = params.get("user")
            sql = """SELECT r.ID, r."USER", r.ID_ROLE FROM USERS r WHERE r."USER" = %s"""
            opt = (user,)
            id_role = int(self.db.request({"sql": sql, "options": opt})[0][2])
            us_stri = "" if id_role in [10, 34] else """and u."USER" = '%s'""" % user
            table = "r."
            if field == "c_vnd":
                table = "v."
            elif field == "c_user":
                table = "u."
                field = '"USER"'
            elif field == "dt":
                table = ""
                field = "ch_date"
            field = "".join([table, field])
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, v.C_VND,
CASE
    WHEN r.CHANGE_DT is null THEN r.DT
    ELSE r.CHANGE_DT
END as ch_date,
r.SOURCE
from prc r
join
    (select p.SH_PRC
    from prc p
    where left(p.c_tovar, 1) >= 'А' and p.n_fg = 1
    and (upper(p.c_tovar) not like upper('%акция%')
        and upper(p.c_tovar) not like upper('%упаковк%')
        and upper(p.c_tovar) not like upper('%\\!до%')
        and upper(p.c_tovar) not like upper('%партия%')
        and upper(p.c_tovar) not like upper('%пакет%')
        and upper(p.c_tovar) not like upper('%уценка%')
        and upper(p.c_tovar) not like upper('%срок%')
        and upper(p.c_tovar) not like upper('%кратно%')
        )
    ) as q
on q.sh_prc = r.sh_prc
{'inner join USERS u on (u."GROUP" = r.ID_ORG)' if us_stri != '' else ''}
INNER JOIN VND v on (r.ID_VND = v.ID_VND)
    and (lower(v.c_vnd) like '%авеста%'
        or lower(v.c_vnd) like '%акцентмед%'
        or lower(v.c_vnd) like '%арал%'
        or lower(v.c_vnd) like '%асна%'
        or lower(v.c_vnd) like '%бсс%'
        or lower(v.c_vnd) like '%витта%'
        or lower(v.c_vnd) like '%грандкапитал%'
        or lower(v.c_vnd) like '%здравсервис%'
        or lower(v.c_vnd) like '%катрен%'
        or lower(v.c_vnd) like '%надежда%'
        or lower(v.c_vnd) like '%норман%'
        or lower(v.c_vnd) like '%протек%'
        or lower(v.c_vnd) like '%профитмед%'
        or lower(v.c_vnd) like '%пульс%'
        or lower(v.c_vnd) like '%регионв%'
        or lower(v.c_vnd) like '%сиа%'
        or lower(v.c_vnd) like '%фармкомплект%'
        or lower(v.c_vnd) like '%фармпартнер%'
        or lower(v.c_vnd) like '%фора-фарм%'
        or lower(v.c_vnd) like '%хэлс%'
    )
order by {field} {direction}"""
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            opt = ()
            _return = []
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                if str(row[11]) == "1":
                    sou = "PLExpert"
                elif str(row[11]) == "2":
                    sou = "Склад"
                elif str(row[11]) == "3":
                    sou = "Агент"
                elif str(row[11]) == "4":
                    sou = "edocs"
                else:
                    sou = "Без источника"
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                    "c_vnd": row[9],
                    "dt": str(row[10]),
                    "source": sou,
                }
                _return.append(r)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsSkip(self, params=None, x_hash=None):
        if self._check(x_hash):
            total_table = params.get("total")
            filt = params.get("c_filter")
            pref = "and %s"
            stri = ""
            ins_ch_date = None
            if filt:
                pars = {}
                pars["c_vnd"] = filt.get("c_vnd")
                pars["c_zavod"] = filt.get("c_zavod")
                pars["c_tovar"] = filt.get("c_tovar")
                pars["c_user"] = filt.get("c_user")
                pars["source"] = filt.get("source")
                pars["id_org"] = filt.get("id_org")
                pars["sh_prc"] = filt.get("sh_prc")
                pars["id_tovar"] = filt.get("id_tovar")
                ssss = []
                if pars["c_vnd"]:
                    s = "v.ID_VND in ({0})".format(pars["c_vnd"])
                    ssss.append(pref % s)
                if pars["c_user"]:
                    s = 'lower(u."USER") like lower(\'%' + pars["c_user"] + "%')"
                    ssss.append(pref % s)
                if pars["id_tovar"]:
                    if pars["id_tovar"].endswith(" "):
                        pars["id_tovar"] = pars["id_tovar"].strip()
                        s = f"lower(r.id_tovar)  = lower('{pars['id_tovar']}')"
                    else:
                        s = "lower(r.id_tovar) like lower('%" + pars["id_tovar"] + "%')"
                    ssss.append("and %s" % s)
                if pars["c_tovar"]:
                    sti = "lower(r.C_TOVAR) like lower('%%')"
                    exclude, pars["c_tovar"] = self._form_exclude(pars["c_tovar"])
                    pars["c_tovar"] = pars["c_tovar"].split()
                    s = (
                        []
                        if len(pars["c_tovar"]) > 0
                        else [
                            sti,
                        ]
                    )
                    for i in range(len(pars["c_tovar"])):
                        ts1 = "lower(r.C_TOVAR) like lower('%" + pars["c_tovar"][i].strip() + "%')"
                        if i == 0:
                            s.append(ts1)
                        else:
                            s.append("and %s" % ts1)
                    if len(exclude) > 0:
                        for i in range(len(exclude)):
                            ts3 = "lower(r.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                            s.append("and %s" % ts3)
                    s = " ".join(s)
                    ssss.append(pref % s)
                if pars["c_zavod"]:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars["c_zavod"] + "%')"
                    ssss.append(pref % s)
                if pars["sh_prc"]:
                    s = "r.sh_prc like lower('%" + pars["sh_prc"] + "%')"
                    ssss.append(pref % s)
                if pars["id_org"]:
                    s = f"""cast(r.id_org as text) like ('{pars['id_org']}%')"""
                    ssss.append("and %s" % s)
                if pars["source"]:
                    if 0 == int(pars["source"]):
                        s = "(r.SOURCE is null or r.SOURCE = 0)"
                    else:
                        s = "r.SOURCE = " + pars["source"]
                    ssss.append("and %s" % s)
                dt = filt.get("dt")
                if dt:
                    pars["start_dt"] = dt.get("start")
                    pars["end_dt"] = dt.get("end")
                    if pars["start_dt"] and not pars["end_dt"]:
                        pars["start_dt"] = pars["start_dt"].split()[0]
                        s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ins_ch_date = ") as foo where %s" % s.format(pars["start_dt"])
                    elif pars["start_dt"] and pars["end_dt"]:
                        pars["end_dt"] = pars["end_dt"].split()[0]
                        s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ins_ch_date = ") as foo where %s" % s.format(pars["start_dt"], pars["end_dt"])
                stri = " ".join(ssss)
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            direction = params.get("direction", "asc")
            # search_re = params.get('search')
            # search_field = params.get('s_field')
            user = params.get("user")
            sql = """SELECT r.ID, r."USER", r.ID_ROLE FROM USERS r WHERE r."USER" = %s"""
            opt = (user,)
            id_role = int(self.db.request({"sql": sql, "options": opt})[0][2])
            us_stri = "" if id_role in [10, 34] else """and u."USER" = '%s'""" % user
            table = "r."
            if field == "c_vnd":
                table = "v."
            elif field == "c_user":
                table = "u."
                field = '"USER"'
            elif field == "dt":
                table = ""
                field = "ch_date"
            field = "".join([table, field])
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, v.C_VND,
CASE
    WHEN r.CHANGE_DT is null THEN r.DT
    ELSE r.CHANGE_DT
END as ch_date,
r.SOURCE
from prc r
{'inner join USERS u on (u."GROUP" = r.ID_ORG)' if us_stri != '' else ''}
INNER JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.n_fg = 1 {stri} {us_stri}
order by {field} {direction}"""
            if ins_ch_date:
                sql = "select * from (" + sql + ins_ch_date
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            opt = ()
            _return = []
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                if str(row[11]) == "1":
                    sou = "PLExpert"
                elif str(row[11]) == "2":
                    sou = "Склад"
                elif str(row[11]) == "3":
                    sou = "Агент"
                elif str(row[11]) == "4":
                    sou = "edocs"
                else:
                    sou = "Без источника"
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                    "c_vnd": row[9],
                    "dt": str(row[10]),
                    "source": sou,
                }
                _return.append(r)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSupplUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            val_s = params.get("value_search")
            if val_s:
                v_ins = f"and lower(p.c_tovar) like lower('%{val_s}%')"
            else:
                v_ins = None
            # opt = (user,)
            opt = ()
            self._setUnwork(user)
            sql = f"""select r1, coalesce(v.C_VND, 'имя не задано'), r2 from (
    select p.ID_VND as r1, count(p.ID_VND) as r2 from PRC p
    inner join USERS u on (u."GROUP" = p.ID_ORG)
    WHERE p.N_FG <> 1 and u."USER" = '{user}'
    {v_ins if v_ins else ''}
    GROUP BY p.ID_VND
    ) rr1
inner join VND v on (v.ID_VND = r1)
order by v.C_VND ASC"""
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {"id_vnd": row[0], "c_vnd": row[1], "count": row[2]}
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSourceUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            self._setUnwork(user)
            sql = """select
CASE
    WHEN r1=0 THEN 10000
    ELSE r1
END as s_id,
CASE
    WHEN r1 = 1 THEN 'Прайс-лист'
    WHEN r1 = 2 THEN 'Склад'
    ELSE 'Остальное'
END as source, r2 from (
    select p.SOURCE as r1, count(p.SOURCE) as r2 from PRC p
    inner join USERS u on (u."GROUP" = p.ID_ORG)
    WHERE p.N_FG <> 1 and u."USER" = %s
    GROUP BY p.SOURCE
    ) rr1
order by r1 DESC"""
            opt = (user,)
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {"id_vnd": row[0], "c_vnd": row[1], "count": row[2]}
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDatesUnlnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            self._setUnwork(user)
            sql = """select CAST(p.DT as DATE) as r3, count(CAST(p.DT as DATE))
from PRC p
inner join USERS u on (u."GROUP" = p.ID_ORG)
WHERE p.N_FG <> 1 and u."USER" = %s
GROUP BY r3"""
            opt = (user,)
            result = self.db.request({"sql": sql, "options": opt})
            _return = []
            for row in result:
                r = {
                    "id_vnd": str(row[0]),
                    "c_vnd": str(row[0]),
                    "count": row[1],
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcs(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            id_vnd = params.get("id_vnd")
            val_s = params.get("value_search")
            if val_s:
                v_ins = f"and lower(r.c_tovar) like lower('%{val_s}%')"
            else:
                v_ins = None
            user = params.get("user")
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = f"""select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE r.id_vnd = {int(id_vnd)} and r.n_fg <> 1 and u."USER" = '{user}' and r.IN_WORK = -1
{v_ins if v_ins else ''}
"""
            sql = sql + self._insLimit(1, 20)
            # opt = (id_vnd, user)
            opt = ()
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                ppp = ", ".join([f"'{q}'" for q in in_work])
                sql = f"""UPDATE PRC
SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = %s)
where SH_PRC in ({ppp})"""
                opt = (user,)
                self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsSou(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            source = params.get("source")
            user = params.get("user")
            if 10000 == int(source):
                source = 0
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = """select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, r.DT
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE r.SOURCE = %s and r.n_fg <> 1 and u."USER" = %s and r.IN_WORK = -1
ORDER by r.DT ASC
            """
            sql = sql + self._insLimit(1, 20)
            opt = (source, user)
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                pprs = ", ".join([f"'{q}'" for q in in_work])
                sql = f"""UPDATE PRC
SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = %s)
where SH_PRC in ({pprs})"""
                opt = (user,)
                self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrcsDate(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            da = params.get("date")
            user = params.get("user")
            self._setUnwork(user)
            t1 = time.time() - st_t
            sql = """select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, r.DT
from prc r
inner join USERS u on (u."GROUP" = r.ID_ORG)
WHERE CAST(r.DT as DATE) = %s and r.n_fg <> 1  and r.IN_WORK = -1 and u."USER" = %s
ORDER by r.SOURCE DESC
"""
            sql = sql + self._insLimit(1, 20)
            opt = (da, user)
            result = self.db.request({"sql": sql, "options": opt})
            t2 = time.time() - st_t
            _return = []
            in_work = []
            for row in result:
                in_work.append(row[0])
                r = {
                    "sh_prc": row[0],
                    "id_vnd": row[1],
                    "id_tovar": row[2],
                    "n_fg": row[3],
                    "n_cena": row[4],
                    "c_tovar": row[5],
                    "c_zavod": row[6],
                    "id_org": row[7],
                    "c_index": row[8],
                }
                _return.append(r)
            t3 = 0
            if len(in_work) > 0:
                pprs = ", ".join([f"'{q}'" for q in in_work])
                sql = f"""UPDATE PRC
                    SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = %s)
                    where SH_PRC in ({pprs})"""
                opt = (user,)
                self.db.execute({"sql": sql, "options": opt})
                t3 = time.time() - st_t
            ret = {"result": True, "ret_val": _return, "time": (t1, t2, t3)}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setWork(self, params=None, x_hash=None):
        if self._check(x_hash):
            _return = []
            sh_prc = params.get("sh_prc")
            user = params.get("user")
            sql = """UPDATE PRC SET IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = %s)
                where SH_PRC = %s returning sh_prc"""
            opt = (user, sh_prc)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0][0]:
                _return.append(res[0][0])
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "upd error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getRefs(self, params=None, x_hash=None):
        if self._check(x_hash):
            p_list = [
                {
                    "sql": "select c_strana, id_spr from spr_strana where flag=1 order by gr_count desc",
                    "opt": (),
                },
                {
                    "sql": "select c_zavod, id_spr from spr_zavod where flag=1 order by c_zavod",
                    "opt": (),
                },
                {
                    "sql": "select r.ID, r.ACT_INGR, r.OA from dv r where r.flag=1 order by r.gr_count desc",
                    "opt": (),
                },
                {
                    "sql": "select nm_group, cd_group from classifier where idx_group = 2 order by gr_count desc",
                    "opt": (),
                },
                {
                    "sql": "select nm_group, cd_group from classifier where idx_group = 3 order by gr_count desc",
                    "opt": (),
                },
                {
                    "sql": "select nm_group, cd_group from classifier where idx_group = 6 order by gr_count desc",
                    "opt": (),
                },
                {
                    "sql": "select nm_group, cd_group from classifier where idx_group = 1 order by gr_count desc",
                    "opt": (),
                },
                {
                    "sql": """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
from classifier cl
where cl.idx_group = 7
order by cl.nm_group asc;""",
                    "opt": (),
                },
                {
                    "sql": "select r.ID, r.C_ISSUE from ISSUE r where r.flag=1 order by r.C_ISSUE",
                    "opt": (),
                },
                {
                    "sql": """select cl.code, cl.nom_name, cl.spr_name
from nom_codes cl
order by cl.code asc, cl.nom_name asc;""",
                    "opt": (),
                },
                {
                    "sql": "select nm_group, cd_group from classifier where idx_group = 5 order by nm_group",
                    "opt": (),
                },
            ]
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            _return = []
            for row in results[0]:
                r = {"id": row[1], "c_strana": row[0]}
                _return.append(r)
            re = {"strana": _return}
            _return = []
            for row in results[1]:
                id_c = 999999999 if row[1] == 0 else row[1]
                r = {"id": id_c, "c_zavod": row[0]}
                _return.append(r)
            re["vendor"] = _return
            _return = []
            for row in results[2]:
                if row[2] == 1:
                    oa = "Для аптек"
                elif row[2] == 2:
                    oa = "Для аптек и аптечных пунктов"
                else:
                    oa = "Нет"
                r = {"id": row[0], "act_ingr": row[1], "oa": oa}
                _return.append(r)
            re["dv"] = _return
            _return = []
            for row in results[3]:
                r = {"id": row[1], "nds": row[0]}
                _return.append(r)
            re["nds"] = _return
            _return = []
            for row in results[4]:
                r = {"id": row[1], "usloviya": row[0]}
                _return.append(r)
            re["hran"] = _return
            _return = []
            for row in results[5]:
                r = {"id": row[1], "sezon": row[0]}
                _return.append(r)
            re["sezon"] = _return
            _return = []
            for row in results[6]:
                r = {"id": row[1], "group": row[0]}
                _return.append(r)
            re["group"] = _return
            _return = []
            for row in results[7]:
                r = {
                    "id": row[1],
                    "c_tgroup": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            re["tg"] = _return
            _return = []
            if isinstance(results[8], list):
                for row in results[8]:
                    r = {"id": row[0], "c_issue": row[1]}
                    _return.append(r)
            re["issue"] = _return
            _return = []
            for row in results[9]:
                r = {
                    "id": " - ".join([row[0], row[1]]),
                    "id_521": " - ".join([row[0], row[1]]),
                }
                _return.append(r)
            re["id_521"] = _return
            _return = []
            _return.append({"id": "-1", "prescr": ""})
            for row in results[10]:
                r = {"id": row[1], "prescr": row[0]}
                _return.append(r)
            re["prescr"] = _return
            ret = {"result": True, "ret_val": re}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getStranaAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select ss.c_strana, ss.id_spr,
    CASE
    WHEN not EXISTS(select g.id_spr
from spr_strana ii
join SPR g on ii.id_spr = g.id_strana and ii.id_spr=ss.id_spr) THEN 0
    ELSE 1
    END
from spr_strana ss where flag=1 order by ss.c_strana"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "c_strana": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select c_strana from spr_strana where c_strana = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genStranaId(self):
        sql = """select max(r.id_spr) from spr_strana r"""
        opt = ()
        res = self.db.request({"sql": sql, "options": opt})[0][0]
        if res:
            t = int(res) + 1
        else:
            t = 1
        return t

    def setStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genStranaId()  # params.get('id')
            val = params.get("value")
            if c_id and val:
                sql = """insert into spr_strana (ID_SPR, C_STRANA, FLAG)
values (%s, %s, 1) returning ID_SPR"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "c_strana": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from SPR_STRANA where ID_SPR = %s returning ID_SPR"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updStrana(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update SPR_STRANA set C_STRANA = %s where ID_SPR = %s returning ID_SPR"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select c_issue from ISSUE where c_issue = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIssueAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select i.c_issue, i.id,
    CASE
    WHEN not EXISTS(select g.id_is
from ISSUE ii
join SPR_ISSUE g on cast(ii.id as text) = g.id_is and ii.id=i.id) THEN 0
    ELSE 1
    END
from ISSUE i where flag=1 order by i.c_issue"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "c_issue": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genIssueId(self):
        sql = """select max(r.id) from issue r"""
        opt = ()
        res = self.db.request({"sql": sql, "options": opt})[0][0]
        if res:
            t = int(res) + 1
        else:
            t = 1
        return t

    def setIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genIssueId()  # params.get('id')
            val = params.get("value")
            if c_id and val:
                sql = """insert into ISSUE (ID, C_ISSUE, FLAG)
                values (%s, %s, 1) returning ID"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "c_issue": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "set error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = sql = """SELECT
    CASE
    WHEN not EXISTS(select id_spr from spr_issue where id_is = %s) THEN 0
    ELSE 1
    END;"""
                opt = (str(c_id),)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                if result == 0:
                    sql = """delete from ISSUE where ID = %s returning ID"""
                    opt = (c_id,)
                    res = self.db.execute({"sql": sql, "options": opt})
                    if res[0]:
                        _ret = {
                            "id": c_id,
                        }
                        ret = {"result": True, "ret_val": _ret}
                    else:
                        ret = {"result": False, "ret_val": "del error"}
                else:
                    ret = {
                        "result": False,
                        "ret_val": "Существует товар с этой форрмой выпуска",
                    }
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updIssue(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update ISSUE set c_issue = %s where ID = %s returning ID"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSupplAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """SELECT r.ID_VND, r.C_VND FROM VND r ORDER by r.C_VND"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                if row[0] is None or row[1] is None:
                    continue
                r = {"id": f"{row[0]}", "value": row[1]}
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getVendorAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select ss.c_zavod, ss.id_spr,
    CASE
    WHEN not EXISTS(select g.id_spr
from spr_zavod ii
join SPR g on ii.id_spr = g.id_zavod and ii.id_spr=ss.id_spr) THEN 0
    ELSE 1
    END,
    ss.website
 from spr_zavod ss where ss.flag=1 order by ss.c_zavod"""
            sql = """select ss.c_zavod, ss.id_spr, ss.website
 from spr_zavod ss where ss.flag=1 order by ss.c_zavod"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                id_c = 999999999 if row[1] == 0 else row[1]
                r = {
                    "id": id_c,
                    "c_zavod": row[0],
                    "delete": False,
                    "website": row[2] or "",
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select c_zavod from spr_zavod where c_zavod = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genVendorId(self):
        sql = """select max(r.id_spr) from spr_zavod r"""
        opt = ()
        res = self.db.request({"sql": sql, "options": opt})[0][0]
        if res:
            t = int(res) + 1
        else:
            t = 1
        return t

    def setVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genVendorId()  # params.get('id')
            val = params.get("value")
            website = params.get("website", "")
            if c_id and val:
                sql = """insert into spr_zavod (ID_SPR, C_ZAVOD, FLAG, website)
values (%s, %s, 1, %s) returning ID_SPR"""
                opt = (c_id, val, website)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                        "c_zavod": val,
                        "website": website,
                        "delete": True,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                if c_id == 999999999:
                    c_id = 0
                sql = """delete from SPR_ZAVOD where ID_SPR = %s returning ID_SPR"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updVendor(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id == 999999999:
                c_id = 0
            val = params.get("value")
            website = params.get("website", "")
            if c_id and val:
                sql = """update SPR_ZAVOD set C_ZAVOD = %s, website = %s
where ID_SPR = %s returning ID_SPR"""
                opt = (val, website, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                        "value": val,
                        "website": website,
                        "delete": False,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDvAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select i.ID, i.ACT_INGR, i.OA,
    CASE
    WHEN not EXISTS(select g.id_spr
        from dv ii
        join SPR g on ii.id = g.id_dv and ii.id=i.id) THEN 0
    ELSE 1
    END,
    i.issue,
    i.issue_compare,
    (
        select
                array_to_string( array_agg(ii.c_issue), ',')
        from issue ii
        join (
            select
                unnest(dv.issue) as dv_is
            from dv
            where 1=1
            and dv.id=i.id) as d on d.dv_is = ii.id
    ),
    i.issue_ap,
    i.issue_ap_compare,
    (
        select
                array_to_string( array_agg(ii.c_issue), ',')
        from issue ii
        join (
            select
                unnest(dv.issue_ap) as dv_is
            from dv
            where 1=1
            and dv.id=i.id) as d on d.dv_is = ii.id
    ),
    issue_dv,
    issue_dv_ap
 from dv i where i.flag=1 order by i.ACT_INGR"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                if row[2] == 1:
                    oa = "Для аптек"
                elif row[2] == 2:
                    oa = "Для аптек и аптечных пунктов"
                else:
                    oa = "Нет"
                issue_dv = json.loads(row[10]) if row[10] else row[10]
                issue_dv_ap = json.loads(row[11]) if row[11] else row[11]
                r = {
                    "id": row[0],
                    "act_ingr": row[1],
                    "oa": oa,
                    "delete": True if row[3] == 0 else False,
                    "prod_forms": issue_dv,
                    # "compare_prod_forms": row[5],
                    "prod_forms_text": self.join_issues_from_array(issue_dv),
                    "prod_forms_ap": issue_dv_ap,
                    # "compare_prod_forms_ap": "test2",
                    "prod_forms_ap_text": self.join_issues_from_array(issue_dv_ap),
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def join_issues_from_array(self, arr):
        arr = arr or []
        text_values = []
        for ar in arr:
            if isinstance(ar, list):
                r = ["("]
                if len(ar) >= 4:
                    v_arr = []
                    separaror = ar[1].get("value")
                    for i in ar[2:-1]:
                        v_arr.append(i.get("value"))
                    group_text = f" {separaror} ".join(v_arr)
                else:
                    group_text = ""
                r.append(group_text)
                r.append(")")
                text_values.append(" ".join(r))
                pass
            elif isinstance(ar, dict):
                text_values.append(ar.get("value"))
        text_value = " ".join(text_values)
        return text_value

    def checkDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select act_ingr from dv where act_ingr = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genDvId(self):
        sql = """select max(r.id) from DV r"""
        opt = ()
        res = self.db.request({"sql": sql, "options": opt})[0][0]
        if res:
            t = int(res) + 1
        else:
            t = 1
        return t

    def setDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genDvId()  # params.get('id')
            val = params.get("value")
            oa1 = int(params.get("oa"))

            issue_forms = params.get("issue_forms")
            issue_forms_ap = params.get("issue_forms_ap")
            issue_forms_ap_text = params.get("issue_forms_ap_text")
            issue_forms_text = params.get("issue_forms_text")

            # prod_forms = params.get("prod_forms")
            # compare_prod_forms = params.get("compare_prod_forms")
            # prod_forms_ap = params.get("prod_forms_ap")
            # compare_prod_forms_ap = params.get("compare_prod_forms_ap")
            # if compare_prod_forms:
            #     compare_prod_forms = int(compare_prod_forms)
            # if compare_prod_forms_ap:
            #     compare_prod_forms_ap = int(compare_prod_forms_ap)
            # prod_forms_ap_text = params.get("prod_forms_ap_text")
            # prod_forms_text = params.get("prod_forms_text")

            if oa1 == 1:
                oa = 1
            elif oa1 == 2:
                oa = 2
            else:
                oa = None

            if c_id and val:
                sql = """insert into DV (ID, ACT_INGR, OA, issue_dv, issue_dv_ap, FLAG)
                values (%s, %s, %s, %s, %s, 1) returning ID"""
                opt = (
                    c_id,
                    val,
                    oa,
                    json.dumps(issue_forms) if issue_forms else issue_forms,
                    json.dumps(issue_forms_ap) if issue_forms_ap else issue_forms_ap,
                )
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    if oa == 1:
                        oa1 = "Для аптек"
                    elif oa == 2:
                        oa1 = "Для аптек и аптечных пунктов"
                    else:
                        oa1 = "Нет"
                    _ret = {
                        "id": c_id,
                        "act_ingr": val,
                        "oa": oa1,
                        "prod_forms_text": issue_forms_text,
                        "prod_forms": issue_forms,
                        # "compare_prod_forms": compare_prod_forms,
                        "prod_forms_ap": issue_forms_ap,
                        "prod_forms_ap_text": issue_forms_ap_text,
                        # "compare_prod_forms_ap": compare_prod_forms_ap,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from DV where ID = %s returning ID"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updDv(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")

            issue_forms = params.get("issue_forms")
            issue_forms_ap = params.get("issue_forms_ap")
            issue_forms_ap_text = params.get("issue_forms_ap_text")
            issue_forms_text = params.get("issue_forms_text")
            print(f"{issue_forms=}")

            print(f"{issue_forms_ap=}")

            # prod_forms = params.get("prod_forms")
            # compare_prod_forms = params.get("compare_prod_forms")
            # prod_forms_ap = params.get("prod_forms_ap")
            # compare_prod_forms_ap = params.get("compare_prod_forms_ap")
            # if compare_prod_forms:
            #     compare_prod_forms = int(compare_prod_forms)
            # if compare_prod_forms_ap:
            #     compare_prod_forms_ap = int(compare_prod_forms_ap)
            # prod_forms_ap_text = params.get("prod_forms_ap_text")
            # prod_forms_text = params.get("prod_forms_text")
            oa1 = int(params.get("oa"))
            if oa1 == 1:
                oa = 1
            elif oa1 == 2:
                oa = 2
            else:
                oa = None
            if c_id and val:
                sql = """update DV
set ACT_INGR = %s,
    OA = %s,
    issue_dv = %s,
    issue_dv_ap = %s
where ID = %s returning ID"""
                opt = (
                    val,
                    oa,
                    json.dumps(issue_forms) if issue_forms else issue_forms,
                    json.dumps(issue_forms_ap) if issue_forms_ap else issue_forms_ap,
                    c_id,
                )
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    if oa == 1:
                        oa1 = "Для аптек"
                    elif oa == 2:
                        oa1 = "Для аптек и аптечных пунктов"
                    else:
                        oa1 = "Нет"
                    _ret = {
                        "id": c_id,
                        "value": val,
                        "oa": oa1,
                        "prod_forms_text": issue_forms_text,
                        "prod_forms": issue_forms,
                        # "compare_prod_forms": compare_prod_forms,
                        "prod_forms_ap": issue_forms_ap,
                        "prod_forms_ap_text": issue_forms_ap_text,
                        # "compare_prod_forms_ap": compare_prod_forms_ap,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getPrescrAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select
cl.nm_group,
cl.cd_group,
CASE
    WHEN not EXISTS(select g.cd_code
        from classifier c
        join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
END
from classifier cl
where cl.idx_group = 5 order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "prescr": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSezonAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
            from classifier cl
            where cl.idx_group = 6 order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "sezon": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select classifier.nm_group from classifier where classifier.nm_group = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genClassId()  # params.get('id')
            val = params.get("value")
            if c_id and val:
                sql = """insert into classifier (cd_group, nm_group, IDX_GROUP)
                values (%s, %s, 6) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "sezon": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from classifier where cd_group = %s returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updSez(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update classifier set nm_group = %s where cd_group = %s returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getHranAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
            from classifier cl
            where cl.idx_group = 3 order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "usloviya": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select classifier.nm_group from classifier where classifier.nm_group = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genClassId()  # params.get('id')
            val = params.get("value")
            if c_id and val:
                sql = """insert into classifier (cd_group, nm_group, IDX_GROUP)
values (%s, %s, 3) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "usloviya": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from classifier where cd_group = %s returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updHran(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update classifier set nm_group = %s where cd_group = %s returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def genGrId(self, params=None, x_hash=None):
        if self._check(x_hash):
            repeat = True
            genId = ""
            sql = """SELECT
    CASE
    WHEN not EXISTS(select c.cd_group from classifier c where c.cd_group = %s) THEN 0
    ELSE 1
    END ;"""
            while repeat:
                genId = uuid.uuid4().hex
                opt = (genId,)
                result = self.db.request({"sql": sql, "options": opt})
                if result[0][0] == 0:
                    repeat = False
                # repeat = False
            ret = {"result": True, "ret_val": genId}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTgAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
from classifier cl
where cl.idx_group = 7
order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "c_tgroup": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getGroupAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
from classifier cl
where cl.idx_group = 1 order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "group": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select classifier.nm_group from classifier where classifier.nm_group = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setTGrMass(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_sprs = params.get("items", [])
            t_groups = params.get("prop_id", [])
            if id_sprs and t_groups:
                sql = """insert into GROUPS (CD_CODE, CD_GROUP) values (%s, %s)
on conflict do nothing;"""
                opts = []
                for id_spr in id_sprs:
                    for t_g in t_groups:
                        opts.append((int(id_spr), str(t_g)))
                if len(opts) > 0:
                    self.db.executemany({"sql": sql, "options": opts})
                    ret = {"result": True, "ret_val": "OK"}
                else:
                    ret = {"result": False, "ret_val": "set_error"}
            else:
                ret = {"result": False, "ret_val": "no id_sprs or id_groups"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _updateSprIssue(self, id_sprs, prop_id):
        if prop_id:
            opts = []
            for id_spr in id_sprs:
                t = (id_spr, prop_id)
                opts.append(t)
            sql_del = f"""delete from spr_issue where id_spr in {str(tuple(id_sprs))}"""
            sql_ins = """INSERT INTO spr_issue (id_spr, id_is) VALUES (%s, %s)"""
            opt = ()
            self.db.execute({"sql": sql_del, "options": opt})
            if len(opts) > 0:
                self.db.executemany({"sql": sql_ins, "options": opts})
                return True
        return False

    def _updateSpr(self, column, id_sprs, prop_id):
        if len(id_sprs) == 1:
            sql = f"""update spr set {column} = %s where id_spr  = {int(id_sprs[0])} returning id_spr;"""
        else:
            sprs = tuple([int(i) for i in id_sprs])
            sql = f"""update spr set {column} = %s where id_spr in {str(sprs)} returning id_spr;"""
        ret = self.db.execute({"sql": sql, "options": (prop_id,)})
        if ret:
            return True
        return False

    def _updateSprGroups(self, idx, id_sprs, prop_id):
        sprs = [int(i) for i in id_sprs]
        if len(sprs) == 1:
            insert = f" = {int(sprs[0])}"
        else:
            insert = f"in {str(tuple(sprs))}"
        sql_del = f"""delete FROM GROUPS as g
WHERE g.CD_GROUP in
    (SELECT c.CD_GROUP
    FROM CLASSIFIER as c
    WHERE c.IDX_GROUP  = %s)
and g.CD_CODE {insert}"""
        opt = (idx,)

        self.db.execute({"sql": sql_del, "options": opt})
        if prop_id:
            opts = []
            sql_ins = """insert into groups (cd_code, cd_group) values (%s, %s) on conflict do nothing;"""
            for id_spr in sprs:
                opts.append((id_spr, prop_id))
            if len(opts) > 0:
                self.db.executemany({"sql": sql_ins, "options": opts})
                return True
            return False
        return True

    def setPropMass(self, params=None, x_hash=None):
        if self._check(x_hash):
            method = params.get("method")
            id_sprs = params.get("items", [])
            prop_id = params.get("prop_id")
            if prop_id:
                prop_id = prop_id.get("id")
            if id_sprs and prop_id and method:
                if method == "dv":
                    res = self._updateSpr("id_dv", id_sprs, prop_id)
                elif method == "gr":
                    res = self._updateSprGroups(1, id_sprs, prop_id)
                elif method == "recipt":
                    res = res = self._updateSprGroups(
                        5,
                        id_sprs,
                        "ZakMedCtg.16" if prop_id == "_set_" else None,
                    )
                elif method == "mandat":
                    res = res = self._updateSprGroups(
                        4,
                        id_sprs,
                        "ZakMedCtg.15" if prop_id == "_set_" else None,
                    )
                elif method == "sezon":
                    res = res = self._updateSprGroups(6, id_sprs, prop_id)
                elif method == "hran":
                    res = res = self._updateSprGroups(3, id_sprs, prop_id)
                elif method == "issue":
                    res = res = self._updateSprIssue(id_sprs, prop_id)
                elif method == "nds":
                    res = res = self._updateSprGroups(2, id_sprs, prop_id)
                elif method == "jv":
                    prop_id = True if prop_id == "_set_" else False
                    res = self._updateSpr("jv", id_sprs, prop_id)
                else:
                    res = False
                if res:
                    ret = {"result": True, "ret_val": "OK"}
                else:
                    ret = {"result": False, "ret_val": "set_error"}
            else:
                ret = {"result": False, "ret_val": "no id_sprs or id_groups"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setNCode(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_sprs = params.get("items")
            prop = params.get("prop_id")
            if prop:
                id_521 = prop.get("id_521")
            else:
                id_521 = None
            ret = {"result": True, "ret_val": "jr"}
            if id_sprs and id_521:
                sql_1 = f"""select cd_code from groups where groups.cd_group = 'ZakMedCtg.1115' and cd_code in ({','.join([str(i) for i in id_sprs])})"""
                opt = ()
                res_1 = self.db.execute({"sql": sql_1, "options": opt})
                # self._print(res_1)
                # res = 1
                sql = f"""update spr set id_521 = {id_521}::text where id_spr in ({','.join([str(i[0]) for i in list(res_1)])}) returning id_spr"""
                # self._print(sql)
                res = self.db.execute({"sql": sql, "options": opt})
                if res:
                    ret = {"result": True, "ret_val": "_ret"}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genClassId()  # params.get('id')
            val = params.get("value")
            index = params.get("index")
            if c_id and val and index:
                sql = """insert into classifier (cd_group, nm_group, IDX_GROUP)
values (%s, %s, %s) returning cd_group"""
                opt = (c_id, val, index)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "group": val, "delete": True}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from classifier where cd_group = %s returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updGr(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update classifier set nm_group = %s where cd_group = %s returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getNCodeAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.code, cl.nom_name, cl.spr_name
from nom_codes cl
order by cl.code asc, cl.nom_name asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": " - ".join(row[0:-1]),
                    "id_521": row[0],
                    "nom_name": row[1],
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getNdsAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select cl.nm_group, cl.cd_group,
    CASE
    WHEN not EXISTS(select g.cd_code
from classifier c
join groups g on c.cd_group = g.cd_group and c.cd_group=cl.cd_group) THEN 0
    ELSE 1
    END
from classifier cl
where cl.idx_group = 2 order by cl.nm_group asc;
            """
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[1],
                    "nds": row[0],
                    "delete": True if row[2] == 0 else False,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select classifier.nm_group from classifier where classifier.nm_group = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = self._genClassId()  # params.get('id')
            val = params.get("value")
            if c_id and val:
                sql = """insert into classifier (cd_group, nm_group, IDX_GROUP)
values (%s, %s, 2) returning cd_group"""
                opt = (c_id, val)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "nds": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            if c_id:
                sql = """delete from classifier where cd_group = %s returning cd_group"""
                opt = (c_id,)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": c_id,
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updNds(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_id = params.get("id")
            val = params.get("value")
            if c_id and val:
                sql = """update classifier set nm_group = %s where cd_group = %s returning cd_group"""
                opt = (val, c_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {"id": c_id, "value": val}
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "upd error"}
            else:
                ret = {"result": False, "ret_val": "no id or value"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            c_tovar = params.get("c_tovar").upper()
            id_strana = params.get("id_strana")
            id_zavod = params.get("id_zavod")
            id_dv = params.get("id_dv")
            # c_tgroup = params.get('c_tgroup')
            user = params.get("user")
            sh_prc = params.get("sh_prc")
            id_521 = params.get("id_521", "")
            jv = params.get("id_jv")
            jv = True if jv == 1 or jv is True else False
            if id_521:
                id_521 = id_521.split("-")[0].strip()
            _return = []
            if id_spr > 0:
                sql = """update SPR set jv = %s, id_521 = %s, C_TOVAR = %s, DT = CAST('NOW' AS TIMESTAMP),
ID_DV = %s, ID_ZAVOD = %s, ID_STRANA = %s, ID_OWNER = (select id from users where "USER" = %s) where ID_SPR = %s"""
                opt = (
                    jv,
                    id_521,
                    c_tovar,
                    id_dv,
                    id_zavod,
                    id_strana,
                    user,
                    id_spr,
                )
                self.db.execute({"sql": sql, "options": opt})
                sql = """delete FROM GROUPS as g
WHERE g.CD_GROUP in
    (SELECT c.CD_GROUP
    FROM CLASSIFIER as c
    WHERE c.IDX_GROUP in (1, 2, 3, 4, 5, 6, 7)
    )
and g.CD_CODE = %s"""
                opt = (id_spr,)
                self.db.execute({"sql": sql, "options": opt})
                self.setIssueSpr(params, x_hash)
                self._insGr(params, id_spr)
                self.setBar(params, x_hash)
                ret = id_spr
                new = False
            else:
                sql = """insert into SPR (C_TOVAR, DT, ID_DV, ID_ZAVOD, ID_STRANA, ID_OWNER, ID_521, JV)
values (%s, CAST('NOW' AS TIMESTAMP), %s, %s, %s, (select id from users where "USER" = %s), %s, %s) returning ID_SPR"""
                opt = (c_tovar, id_dv, id_zavod, id_strana, user, id_521, jv)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                if result:
                    self._updValue(id_strana, "spr_strana", "id_spr")
                    self._updValue(id_dv, "dv", "id")
                    if sh_prc:
                        pars = {
                            "sh_prc": sh_prc,
                            "user": user,
                            "id_spr": result,
                        }
                        self.setLnk(params=pars, x_hash=x_hash)
                    self._insGr(params, result, new=True)
                    params["id_spr"] = result
                    self.setIssueSpr(params, x_hash)
                    self.setBar(params, x_hash)
                ret = result  # new id_spr
                new = True
            _return.append(ret)
            rett = {"datas": _return, "new": new, "params": params}
            ret = {"result": True, "ret_val": rett}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUsersAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """select r.ID, r."USER", r.PASSWD, r."GROUP", r.INN, a.NAME, r.ID_ROLE from users r
INNER JOIN ROLES a on (a.ID = r.ID_ROLE)"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": row[0],
                    "c_user": row[1],
                    "id_group": row[3],
                    "c_inn": row[4],
                    "c_role": row[5],
                    "id_role": 1 if row[6] == 0 else row[6],
                    "dt": "",
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            new_user = params.get("c_user")
            passwd = params.get("c_pwrd")
            group = params.get("id_group", -1)
            id_role = params.get("id_role")
            if id_role == 1:
                id_role = 0
            u_id = params.get("id")
            if id_role in (10, 34) and group == -1:
                group = 999999
            inn = params.get("c_inn")
            if u_id:
                sql = """update USERS set "USER" = %s, "GROUP" = %s,
PASSWD = %s, INN = %s, ID_ROLE = %s where id = %s returning id"""
                opt = (new_user, group, passwd, inn, id_role, u_id)
                res = self.db.execute({"sql": sql, "options": opt})
                if res[0]:
                    _ret = {
                        "id": res[0][0],
                    }
                    ret = {"result": True, "ret_val": _ret}
                else:
                    ret = {"result": False, "ret_val": "add error"}
            else:
                ret = {"result": False, "ret_val": "id error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            check = params.get("check")
            if check:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select r."USER" from users r where r."USER" = %s) THEN 0
    ELSE 1
    END;"""
                opt = (check,)
                result = int(self.db.request({"sql": sql, "options": opt})[0][0])
                _return = True if result == 0 else False
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "Empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            new_user = params.get("c_user")
            passwd = params.get("c_pwrd")
            group = params.get("id_group")
            id_role = params.get("id_role")
            if id_role == 1:
                id_role = 0
            if id_role in (10, 34) and group == -1:
                group = 999999
            inn = params.get("c_inn")
            sql = """insert into USERS ("USER", "GROUP", PASSWD, INN, ID_ROLE) values (%s,
%s, %s, %s, %s) returning id"""
            opt = (new_user, group, passwd, inn, id_role)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0]:
                _ret = {
                    "id": res[0][0],
                    "c_user": new_user,
                    "id_group": group,
                    "c_inn": inn,
                    "id_role": id_role,
                    "dt": "",
                }
                ret = {"result": True, "ret_val": _ret}
            else:
                ret = {"result": False, "ret_val": "add error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUser(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            id_u = params.get("id")
            sql = """select r.ID, r."USER", r.PASSWD, r."GROUP", r.INN, a.NAME, r.ID_ROLE from users r
INNER JOIN ROLES a on (a.ID = r.ID_ROLE) WHERE r.ID = %s"""
            opt = (id_u,)
            res = self.db.execute({"sql": sql, "options": opt})
            if res[0]:
                _ret = {
                    "id": res[0][0],
                    "c_user": res[0][1],
                    "c_pwrd": res[0][2],
                    "id_group": res[0][3],
                    "c_inn": res[0][4],
                    "c_role": res[0][5],
                    "id_role": 1 if res[0][6] == 0 else res[0][6],
                    "dt": "",
                }
                ret = {"result": True, "ret_val": _ret}
            else:
                ret = {"result": False, "ret_val": "add error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBarsSpr(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            field = field.replace("c_tovar", "barcode")
            direction = params.get("direction", "asc")
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            stri = "lower(r.barcode) like lower('%{0}%')".format(search_re)
            sql_c = """select count(*) from spr_barcode r WHERE %s """ % stri
            sql_c = sql_c.replace("WHERE lower(r.barcode) like lower('%%%%')", "")
            sql = f"""select distinct r.barcode from spr_barcode r where {stri} order by r.{field} {direction} """
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.barcode) like lower('%%%%')", "")
            p_list = (
                [
                    {"sql": sql, "opt": ()},
                ]
                if total_table
                else [{"sql": sql, "opt": ()}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            t1 = time.time() - st_t
            _return = []
            st_t = time.time()
            idc = 0
            for row in result:
                r = {
                    "id": idc,
                    "$row": "c_tovar",
                    "open": False,
                    "c_tovar": row[0],
                    "data": [],
                }
                idc += 1
                sql = """select r.id_spr, s.c_tovar, r.ch_date, st.c_strana, zav.c_zavod
from spr_barcode r
join spr s on r.id_spr = s.id_spr
left join spr_strana st on s.id_strana = st.id_spr
left join spr_zavod zav on s.id_zavod = zav.id_spr
where r.barcode = %s order by s.id_spr ASC"""
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "id_spr": rrr[0],
                        "c_tovar": rrr[1],
                        "id_state": "active",
                        "dt": str(rrr[2]) or "",
                        "owner": "",
                        "c_strana": rrr[3],
                        "c_zavod": rrr[4],
                    }
                    r["data"].append(rr)
                _return.append(r)
            t3 = time.time() - st_t
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "time": (t1, t3),
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprBars(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            field = field.replace("barcode", "c_tovar")
            direction = params.get("direction", "asc")
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "r.C_TOVAR like upper('%%')"
            cbars = params.get("cbars")
            cbars = cbars.split(",")
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                ts1 = "r.C_TOVAR like upper('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "r.C_TOVAR not like upper('%" + exclude[i].strip() + "%')"
                    stri.append("and %s" % ts3)
            stri = " ".join(stri)
            stri = stri.replace("r.C_TOVAR like upper('%%%%') and", "")
            sql_c = """select count(*)
from (SELECT r.ID_SPR as id, idspr, r.c_tovar as c_tovar, qty,
        CASE
        WHEN qty is null THEN 0
        ELSE qty
        END as quantity
    from SPR r
    left outer join (select idspr, qty
        FROM (select s.ID_SPR as idspr,
            count(s.ID_SPR) as qty
            FROM SPR_BARCODE s
            GROUP BY idspr) as fbar1
        ) as rrrr on (r.id_spr = idspr)
    WHERE {0}
    ) as fbar
where quantity >= {1} AND quantity <= {2}
            """.format(
                stri, cbars[0], cbars[1]
            )
            sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            sql = """select id, c_tovar, quantity
from (SELECT r.ID_SPR as id, idspr, r.c_tovar as c_tovar, qty,
        CASE
        WHEN qty is null THEN 0
        ELSE qty
        END as quantity
    from SPR r
    left outer join (select idspr, qty
        FROM (select s.ID_SPR as idspr,
            count(s.ID_SPR) as qty
            FROM SPR_BARCODE s
            GROUP BY idspr) as fbar1
        ) as rrrrr on (r.id_spr = idspr)
    WHERE {0}
    ) as fbar
where quantity >= {1} AND quantity <= {2}
order by {3} {4}
""".format(
                stri, cbars[0], cbars[1], field, direction
            )
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            t1 = time.time() - st_t
            opt = ()
            _return = []
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            st_t = time.time()
            for row in result:
                st1 = " | ".join([str(row[0]), row[1]])
                r = {
                    "id": row[0],
                    "$row": "barcode",
                    "open": False,
                    "barcode": st1,
                    "data": [],
                }
                sql = """select r.barcode, r.ch_date from spr_barcode r where r.id_spr = %s order by r.barcode ASC"""
                opt = (row[0],)
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "barcode": rrr[0],
                        "id_state": "active",
                        "dt": str(rrr[1]) or "",
                        "owner": "",
                        "count": "",
                    }
                    r["data"].append(rr)
                r["count"] = "" if len(r["data"]) == 0 else len(r["data"])
                _return.append(r)
            t3 = time.time() - st_t
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "time": (t1, t3),
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIsId(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select max(r.id) from issue r"""
            opt = ()
            res = self.db.request({"sql": sql, "options": opt})[0][0]
            if res:
                t = int(res) + 1
            else:
                t = 1

            ret = {"result": True, "ret_val": t}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDvIsAp(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            try:
                id_spr = int(id_spr)
            except Exception:
                return json.dumps(
                    {"result": False, "ret_val": "no id_spr"},
                    ensure_ascii=False,
                )
            if id_spr:
                sql = """select id, issue_dv_ap from dv where id = %s"""
                sql_old = """select
    issue.id,
    issue.c_issue
from issue
join (
    select
        unnest(dv.issue_ap) as dv_is
    from dv
    where 1=1
    and id= %s ) as d on d.dv_is = issue.id
order by issue.id"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                row_b = t[0]
                r = {"c_issue": json.loads(row_b[1]) if row_b[1] else row_b[1], "id": row_b[0]}
                ret = {"result": True, "ret_val": r}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getDvIs(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            try:
                id_spr = int(id_spr)
            except Exception:
                return json.dumps(
                    {"result": False, "ret_val": "no id_spr"},
                    ensure_ascii=False,
                )
            if id_spr:
                sql = """select id, issue_dv from dv where id = %s"""
                sql_old = """select
    issue.id,
    issue.c_issue
from issue
join (
    select
        unnest(dv.issue) as dv_is
    from dv
    where 1=1
    and id= %s ) as d on d.dv_is = issue.id
order by issue.id"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                row_b = t[0]
                r = {"c_issue": json.loads(row_b[1]) if row_b[1] else row_b[1], "id": row_b[0]}
                ret = {"result": True, "ret_val": r}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getIs(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = """select r.id, r.c_issue
from issue r
join spr_issue s on (cast(s.id_is as integer) = r.id)
where s.id_spr = %s"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {"c_issue": row_b[1], "id": row_b[0]}
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getTg(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = """select classifier.nm_group, classifier.cd_group
from CLASSIFIER
inner join GROUPS on (groups.cd_group = classifier.cd_group)
where ( classifier.idx_group = 7 and groups.cd_code = %s )"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {"c_tgroup": row_b[0], "id": row_b[1]}
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            if id_spr:
                sql = """select r.barcode , r.ch_date from spr_barcode r where r.id_spr = %s"""
                opt = (id_spr,)
                t = self.db.request({"sql": sql, "options": opt})
                _return = []
                for row_b in t:
                    r = {
                        "barcode": row_b[0],
                        "dt": str(row_b[1]) or "",
                    }
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            if barcode and id_spr:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select id_spr from spr_barcode where id_spr = %s and barcode = %s) THEN 0
    ELSE 1
    END;"""
                opt = (id_spr, barcode)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            if id_spr and barcode:
                sql = """delete from spr_barcode where id_spr = %s and barcode = %s"""
                opt = (id_spr, barcode)
                self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": "updated"}
            elif barcode:
                sql = """delete from spr_barcode where barcode = %s"""
                opt = (barcode,)
                self.db.execute({"sql": sql, "options": opt})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr or barcode"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setIssueSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            issue = params.get("issue")
            issue = issue.split("; ")
            if len(issue) > 1 and isinstance(issue, list):
                issue.pop()
            if id_spr:
                opt_i = []
                for i in issue:
                    t = (id_spr, i)
                    if i:
                        opt_i.append(t)
                sql = """delete from spr_issue where id_spr = %s"""
                opt = (id_spr,)
                self.db.execute({"sql": sql, "options": opt})
                if len(opt_i) > 0:
                    sql = """INSERT INTO spr_issue (id_spr, id_is) VALUES (%s, (select id from ISSUE where c_issue = %s))"""
                    self.db.executemany({"sql": sql, "options": opt_i})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setBar(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = params.get("id_spr")
            barcode = params.get("barcode")
            barcode = barcode.split()
            if id_spr:
                opt_i = []
                for i in barcode:
                    t = (id_spr, i)
                    opt_i.append(t)
                sql = """delete from spr_barcode where id_spr = %s"""
                opt = (id_spr,)
                self.db.execute({"sql": sql, "options": opt})
                if len(opt_i) > 0:
                    sql = """INSERT INTO spr_barcode (id_spr, barcode) VALUES (%s, %s) RETURNING id_spr"""
                    self.db.executemany({"sql": sql, "options": opt_i})
                ret = {"result": True, "ret_val": "updated"}
            else:
                ret = {"result": False, "ret_val": "no id_spr"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkDv1(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select act_ingr from dv where act_ingr = %s) THEN 0
    ELSE 1
    END;"""
                opt = (act_ingr,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setDv1(self, params=None, x_hash=None):
        if self._check(x_hash):
            act_ingr = params.get("act_ingr")
            if act_ingr:
                sql = """INSERT INTO dv (act_ingr, flag) VALUES (upper(%s), 1) RETURNING id"""
                opt = (act_ingr,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                _return = {"id": result, "act_ingr": act_ingr}
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no new name"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def checkZavod(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_zavod = params.get("c_zavod")
            if c_zavod:
                sql = """SELECT
    CASE
    WHEN not EXISTS(select c_zavod from spr_zavod where c_zavod = %s) THEN 0
    ELSE 1
    END;"""
                opt = (c_zavod,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                valid = True if result == 0 else False
                _return = "OK" if result == 0 else "Non unique"
                ret = {"result": valid, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "empty string"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setZavod(self, params=None, x_hash=None):
        if self._check(x_hash):
            c_zavod = params.get("c_zavod")
            if c_zavod:
                sql = """INSERT INTO spr_zavod (c_zavod, flag) VALUES (upper(%s), 1) RETURNING id_spr"""
                opt = (c_zavod,)
                result = self.db.execute({"sql": sql, "options": opt})[0][0]
                _return = {"id": result, "c_zavod": c_zavod}
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "no new name"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setRazbr(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            sh_prc = params.get("sh_prc")
            series = params.get("series")
            razbr = params.get("razbr")
            if user and sh_prc and series:
                sql = f"""update brak set razbrak = {razbr} where sh_prc = '{sh_prc}' and series = '{series}';"""
                self.db.execute({"sql": sql, "options": ()})
                _return = "OK"
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "value error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _checkBrakMail(self, sh_prc, letter_number=None):
        ret_val = []
        # проверяем, есть ли товары с таким же хешем и без писем
        # если да, то формируем список из них (серия, хеш)
        # если letter_number, то проверяем во всех письмах записях - придумать как выдергивать номер письма из названия
        # если нет, то только в тех, где отсуствует письмо
        if letter_number:
            sql_check = f"""select distinct t1.sh_prc, t2.series from brak t2
left join brak_mail t3 on t3.SH_PRC = t2.SH_PRC and t3.SERIYA = t2.series and t3.deleted = 0
join lnk t1 on ( t1.sh_prc = t2.sh_prc and t1.ID_VND = 10000)
WHERE t1.sh_prc = '{sh_prc}' and
((t3.link_file is null) or (lower(title_doc) not like lower('{letter_number}')))
ORDER by t2.series"""
        else:
            sql_check = """select t1.sh_prc, t2.series from brak t2
left join brak_mail t3 on t3.SH_PRC = t2.SH_PRC and t3.SERIYA = t2.series and t3.deleted = 0
join lnk t1 on ( t1.sh_prc = t2.sh_prc and t1.ID_VND = 10000)
WHERE t1.sh_prc = '{sh_prc}' and t3.link_file is null
ORDER by t2.series"""
        _ret = self.db.request({"sql": sql_check, "options": ()})
        for row in _ret:
            r = {"sh_prc": row[0], "series": row[1]}
            ret_val.append(r)
        return ret_val

    def setMassBrakMail(self, params, x_hash=None):
        if self._check(x_hash):
            item = params.get("item")
            series_list = params.get("series_list")
            self._setBrakMail(item, series_list)
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setBrakMail_(self, params=None, x_hash=None):
        if self._check(x_hash):
            item = params.get("item")
            sh_prc = item.get("sh_prc")
            ret = {
                "result": True,
                "ret_val": {
                    "m_count": 1,
                    "similar": self._checkBrakMail(sh_prc),
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _setBrakMail(self, item, series_list):
        opts_mails = []
        opts_files = []

        letter_id = item.get("id")
        sh_prc = item.get("sh_prc")
        title = item.get("name")  # "title"
        title_torg = item.get("t_name")  # "title_torg"
        fabricator = item.get("vendor")  # "fabricator"
        region = item.get("region", "")  # "region"
        n_rec = item.get("number", "")  # n_rec"
        gv = item.get("gv", "")  # "gv"
        title_doc = item.get("n_doc")  # "title_doc"
        opis = item.get("desc", "")  # "opis"
        letter_text = item.get("letter")  # letter text
        ch_date = item.get("ch_dt")  # dt_edit
        sql_f = """insert into BRAK_MAIL_TEXT (LINK_FILE, MAIL_TEXT)
values (%s, %s)
ON CONFLICT (LINK_FILE) DO UPDATE
SET (LINK_FILE, MAIL_TEXT, DELETED) = (%s, %s, 0)"""
        if letter_id == 99999999:
            sql = """insert into BRAK_MAIL (title, title_torg, seriya, fabricator, region,
n_rec, gv, title_doc, opis, sh_prc, link_file, dt, dt_edit )
values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,  current_timestamp, %s) returning id;"""
        else:
            sql = """update BRAK_MAIL set title = %s, title_torg = %s, seriya = %s, fabricator = %s, region = %s,
n_rec = %s, gv = %s, title_doc = %s, opis = %s, sh_prc = %s, link_file = %s, dt_edit = %s
where id = %s returning id;"""
        for ser in series_list:
            f_name = item.get("f_name") or str(uuid.uuid1())  # "link_file"
            series = ser  # "seriya"
            opt = (
                title,
                title_torg,
                series,
                fabricator,
                region,
                n_rec,
                gv,
                title_doc,
                opis,
                sh_prc,
                f_name,
                ch_date,
            )
            ppprs = psycopg2.Binary(letter_text.encode())
            opt_f = (f_name, ppprs) + (f_name, ppprs)
            opts_files.append({"sql": sql_f, "opt": opt_f})
            if letter_id != 99999999:
                opt = opt + (letter_id,)
            opts_mails.append({"sql": sql, "opt": opt})
        pool = ThreadPool(len(opts_mails))
        pool.map(self._make_sql, opts_mails)
        pool.close()
        pool.join()
        pool1 = ThreadPool(len(opts_files))
        pool1.map(self._make_sql, opts_files)
        pool1.close()
        pool1.join()
        return True

    def setBrakMail(self, params=None, x_hash=None):
        if self._check(x_hash):
            item = params.get("item")
            series = item.get("series")  # "seriya"
            sh_prc = item.get("sh_prc")
            series_list = [
                series,
            ]
            self._setBrakMail(item, series_list)
            sql = (
                """select count(*) from brak_mail where SH_PRC = '{sh_prc}' and SERIYA = '{series}' and DELETED = 0"""
            )
            opt = ()
            ress = self.db.request({"sql": sql, "options": opt})
            _return = ress[0][0]
            ret = {
                "result": True,
                "ret_val": {
                    "m_count": _return,
                    "similar": self._checkBrakMail(sh_prc),
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delBrakMail(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get("user")
            letter_id = params.get("id")
            f_name = params.get("f_name")
            sql = """delete from BRAK_MAIL where id = %s returning sh_prc, seriya;"""
            opt = (letter_id,)
            _ = self.db.execute({"sql": sql, "options": opt})
            # sh_prc = res[0][0]
            # series = res[0][1]
            sql = """delete from BRAK_MAIL_TEXT where LINK_FILE = %s """
            opt = (f_name,)
            _ = self.db.execute({"sql": sql, "options": opt})
            sql = (
                """select count(*) from brak_mail where SH_PRC = '{sh_prc}' and SERIYA = '{series}' and DELETED = 0"""
            )
            ress = self.db.request({"sql": sql, "options": ()})
            _return = ress[0][0]
            ret = {"result": True, "ret_val": {"m_count": _return}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBrakMailApi(self, params=None, x_hash=None):
        if self._check(x_hash):
            _return = []
            action = params.get("action")
            if not isinstance(action, list):
                return json.dumps(
                    {"result": False, "ret_val": "params missing"},
                    ensure_ascii=False,
                )

            for action_row in action:
                if isinstance(action_row, str):
                    action_row = json.loads(action_row)
                if isinstance(action_row, dict):
                    series, sh_prc = action_row.get("mass")
                    sql = f"""select bm.sh_prc, bm.title, bm.title_torg, bm.seriya, bm.fabricator, bm.region, bm.n_rec, bm.dt_edit, bm.gv,
        bm.title_doc, bm.opis, bm.link_file, bm.id, bm.dt,
    CASE
        WHEN bmt.MAIL_TEXT is null THEN ''
        ELSE bmt.MAIL_TEXT
    END as m_text,
    bm.external_mail_link
    from brak_mail bm
    LEFT JOIN BRAK_MAIL_TEXT bmt on bmt.LINK_FILE = bm.LINK_FILE and bm.deleted = 0
    where bm.sh_prc = '{sh_prc}' and bm.seriya = '{series}' and bm.deleted != 1
    order by id asc; """
                    res = self.db.request({"sql": sql, "options": ()})

                    for row in res:
                        pars = row[14]
                        try:
                            pars = pars.tobytes()
                            pars = pars.decode()
                        except Exception:
                            pass
                        external_link = row[15]
                        has_link = False
                        if external_link:
                            has_link = True
                        r = {
                            "sh_prc": row[0],
                            "title": row[1],  # "title"
                            "title_torg": row[2],  # "title_torg"
                            "seriya": row[3],  # "seriya"
                            "fabricator": row[4],  # "fabricator"
                            "region": row[5],  # "region"
                            "n_rec": row[6],  # n_rec"
                            "dt_edit": str(row[7]),  # "dt_edit"
                            "gv": row[8],  # "gv"
                            "title_doc": row[9],  # "title_doc"
                            "opis": row[10],  # "opis"
                            "link_file": row[11],  # "link_file"
                            "id": row[12],  # "id"
                            "dt": str(row[13]),  # "dt"
                            "doc_text": pars,  # letter text
                            "external_link": external_link,
                            "has_link": has_link,
                        }
                        _return.append(r)
            ret = {"results": _return, "success": True, "req": "getMail"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBrakMail(self, params=None, x_hash=None):
        if self._check(x_hash):
            series = params.get("series", "")
            sh_prc = params.get("sh_prc", "")
            sql = f"""select bm.sh_prc, bm.title, bm.title_torg, bm.seriya, bm.fabricator, bm.region, bm.n_rec, bm.dt_edit, bm.gv,
    bm.title_doc, bm.opis, bm.link_file, bm.id, bm.dt,
CASE
    WHEN bmt.MAIL_TEXT is null THEN ''
    ELSE bmt.MAIL_TEXT
END as m_text,
bm.external_mail_link
from brak_mail bm
LEFT JOIN BRAK_MAIL_TEXT bmt on bmt.LINK_FILE = bm.LINK_FILE and bm.deleted = 0
where bm.sh_prc = '{sh_prc}' and bm.seriya = '{series}' and bm.deleted != 1
order by id asc; """
            res = self.db.request({"sql": sql, "options": ()})
            _return = []
            for row in res:
                pars = row[14]
                try:
                    pars = pars.tobytes()
                    pars = pars.decode()
                except Exception:
                    pass
                external_link = row[15]
                has_link = False
                if external_link:
                    has_link = True

                r = {
                    "sh_prc": row[0],
                    "name": row[1],  # "title"
                    "t_name": row[2],  # "title_torg"
                    "series": row[3],  # "seriya"
                    "vendor": row[4],  # "fabricator"
                    "region": row[5],  # "region"
                    "number": row[6],  # n_rec"
                    "ch_dt": str(row[7]),  # "dt_edit"
                    "gv": row[8],  # "gv"
                    "n_doc": row[9],  # "title_doc"
                    "desc": row[10],  # "opis"
                    "f_name": row[11],  # "link_file"
                    "id": row[12],  # "id"
                    "cre_date": str(row[13]),  # "dt"
                    "letter": pars,  # letter text
                    "has_link": has_link,
                    "external_link": external_link,
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getBrakSearchNoMail(self, params=None, x_hash=None):
        params["nomail"] = True
        return self.getBrakSearch(params, x_hash)

    def getBrakSearch(self, params=None, x_hash=None):
        st_t = time.time()
        names = {
            "c_name": "t1.c_tovar",
            "sh_prc": "t1.sh_prc",
            "c_zavod": "t1.c_zavod",
            "series": "t2.series",
            "dt": "t2.DT",
            "razbr": "t2.RAZBRAK",
        }
        if self._check(x_hash):
            total_table = params.get("total")
            nomail = params.get("nomail")
            mail_join = ""
            mail_condition = ""
            if nomail:
                mail_join = (
                    "left join brak_mail t3 on t3.SH_PRC = t2.SH_PRC and t3.SERIYA = t2.series and t3.deleted = 0"
                )
                mail_condition = "and (t3.link_file is null or t3.external_mail_link is null)"
                del params["nomail"]
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            # series = params.get('series','')
            name = params.get("search", "")
            field = params.get("field", "dt")
            field = names.get(field)
            direction = params.get("direction", "desc")
            filt = params.get("c_filter")
            ssss = []
            search_re = name.split()
            sti = "(lower(t1.C_TOVAR) like lower('%%') or lower(t2.series) like lower('%%'))"
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                ts1 = f"(lower(t1.C_TOVAR) like lower('%{search_re[i].strip()}%') or lower(t2.series) like lower('%{search_re[i].strip()}%'))"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            if filt:
                pars = {}
                dt = filt.get("dt")
                if dt:
                    pars["start_dt"] = dt.get("start")
                    pars["end_dt"] = dt.get("end")
                    if pars["start_dt"] and not pars["end_dt"]:
                        pars["start_dt"] = pars["start_dt"].split()[0]
                        s = """and (cast(t2.DT as timestamp) >= CAST('{0}' as TIMESTAMP) AND cast(t2.DT as timestamp) < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ssss.append(s.format(pars["start_dt"]))
                    elif pars["start_dt"] and pars["end_dt"]:
                        pars["end_dt"] = pars["end_dt"].split()[0]
                        s = """and (cast(t2.DT as timestamp) >= cast('{0}' as timestamp) AND cast(t2.DT as timestamp) <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ssss.append(s.format(pars["start_dt"], pars["end_dt"]))
            sql = f"""select t1.sh_prc, t1.id_spr, t1.c_tovar, t1.c_zavod, t2.series, t2.RAZBRAK, t2.DT from brak t2
{mail_join}
join lnk t1 on ( t1.sh_prc = t2.sh_prc and t1.ID_VND = 10000)
WHERE {' '.join(stri)} {mail_condition}"""
            sql = sql + " " + " ".join(ssss)
            sql_c = f"""select count(*) from ({sql}) as sc"""
            order = f""" ORDER by {field} {direction}, t1.c_tovar"""
            sql = sql + order
            sql = sql + self._insLimit(start_p, end_p)
            if nomail:
                print(sql)
            p_list = (
                [
                    {"sql": sql, "opt": ()},
                ]
                if total_table
                else [{"sql": sql, "opt": ()}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            _return = []
            p_list = []
            for row in results[0]:
                r = {
                    "sh_prc": row[0],
                    "c_name": row[2],
                    "c_zavod": row[3],
                    "series": row[4],
                    "razbr": row[5],
                    "dt": row[6],
                    "m_count": 0,
                }
                try:
                    ser = row[4].replace("'", "''")
                except Exception:
                    ser = row[4]
                sql = f"""select count(*) from brak_mail where SH_PRC = '{row[0]}' and SERIYA = '{ser}' and DELETED = 0"""
                opt = ()
                p_list.append({"sql": sql, "opt": opt})
                _return.append(r)
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            for i, row in enumerate(results):
                _return[i]["m_count"] = row[0][0]
            t1 = time.time() - st_t
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "time": (t1),
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprSearch(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            filt = params.get("c_filter")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            field = field.replace("id_zavod", "z.c_zavod")
            field = field.replace("c_tovar", "r.c_tovar")
            field = field.replace("id_spr", "r.id_spr")
            # field = field.replace('id_jv', 'r.jv')
            direction = params.get("direction", "asc")
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "r.C_TOVAR like upper('%%')"
            zavod = []
            exclude, search_re = self._form_exclude(search_re)
            if search_re.find("+") > -1:
                search_re, search_zavod = search_re.split("+")
                zavod = [
                    search_zavod,
                ]
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                ts1 = "r.C_TOVAR like upper('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            if len(zavod) > 0:
                for i in zavod:
                    ts2 = "lower(z.C_ZAVOD) like lower('%" + i.strip() + "%')"
                    stri.append("and %s" % ts2)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "r.C_TOVAR not like upper('%" + exclude[i].strip() + "%')"
                    stri.append("and %s" % ts3)
            stri = " ".join(stri)
            if filt:
                pars = {}
                pars["id_spr"] = filt.get("id_spr")
                pars["c_dv"] = filt.get("c_dv")
                ssss = []
                if pars["id_spr"]:
                    s = "and cast(r.id_spr as varchar(32)) like ('" + pars["id_spr"] + "%')"
                    ssss.append(s)
                stri += " " + " ".join(ssss)
            stri = stri.replace("lower(z.C_ZAVOD) like lower('%%%%') and", "")
            sql_c = """SELECT count(*)
FROM SPR r
{0}
{1}
WHERE {2}
            """.format(
                "LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)" if "z.C_ZAVOD" in stri else "",
                "join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars["c_dv"]) if pars["c_dv"] else "",
                stri,
            )
            sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            sql = f"""SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR,
gr, nds, uhran, sezon, mandat, presc, u."USER", r.jv, r.jv_fp
FROM SPR r
left join users u on (u.id = r.ID_OWNER)
LEFT OUTER join spr_strana s on (r.ID_STRANA = s.ID_SPR)
LEFT OUTER join
    (select g1.CD_CODE cc1, g1.CD_GROUP cg1, c1.NM_GROUP nds
    from GROUPS g1
    inner join CLASSIFIER c1 on (g1.CD_GROUP = c1.CD_GROUP) where c1.IDX_GROUP = 2
    ) as rrr2 on (r.ID_SPR = cc1)
LEFT OUTER join
    (select g2.CD_CODE cc2, g2.CD_GROUP cg2, c2.NM_GROUP uhran
    from GROUPS g2
    inner join CLASSIFIER c2 on (g2.CD_GROUP = c2.CD_GROUP) where c2.IDX_GROUP = 3
    ) as rrr3 on (r.ID_SPR = cc2)
LEFT OUTER join
    (select g3.CD_CODE cc3, g3.CD_GROUP cg3, c3.NM_GROUP sezon
    from GROUPS g3
    inner join CLASSIFIER c3 on (g3.CD_GROUP = c3.CD_GROUP) where c3.IDX_GROUP = 6
    ) as rrr4 on (r.ID_SPR = cc3)
LEFT OUTER join
    (select g4.CD_CODE cc4, g4.CD_GROUP cg4, c4.NM_GROUP mandat
    from GROUPS g4
    inner join CLASSIFIER c4 on (g4.CD_GROUP = c4.CD_GROUP) where c4.IDX_GROUP = 4
    ) as rrr5 on (r.ID_SPR = cc4)
LEFT OUTER join
    (select g5.CD_CODE cc5, g5.CD_GROUP cg5, c5.NM_GROUP presc
    from GROUPS g5
    inner join CLASSIFIER c5 on (g5.CD_GROUP = c5.CD_GROUP) where c5.IDX_GROUP = 5
    ) as rrr6 on (r.ID_SPR = cc5)
LEFT OUTER join
    (select g.CD_CODE cc, g.CD_GROUP cg, c.NM_GROUP gr
    from GROUPS g
    inner join CLASSIFIER c on (g.CD_GROUP = c.CD_GROUP) where c.IDX_GROUP = 1
    ) as rrr1 on (r.ID_SPR = cc)
{"join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars['c_dv']) if pars['c_dv'] else "LEFT OUTER join dv d on (r.ID_DV = d.ID)"}
LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)
WHERE {stri} ORDER by {field} {direction}
"""
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            if len(ssss) > 1:
                sql = sql.replace("WHERE r.C_TOVAR like upper('%%')", "")
                sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%')", "")
            opt = ()
            _return = []
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            t2 = time.time() - st_t
            result = results[0]
            for row in result:
                r = {
                    "id_spr": row[0],
                    "c_tovar": row[1],
                    "id_dv": row[2],
                    "id_zavod": row[3],
                    "id_strana": row[4],
                    "c_dv": row[5],
                    "c_group": row[6],
                    "c_nds": row[7],
                    "c_hran": row[8],
                    "c_sezon": row[9],
                    "c_mandat": row[10],
                    "c_prescr": row[11],
                    "owner": row[12] or "",
                    "search": params.get("search"),
                    "id_jv": 1 if row[13] else 0,
                    "id_jv_id": 1 if row[14] else 0,
                }
                _return.append(r)

            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "time": t2,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprSearchAdmRls(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            if field == "c_group":
                field = "gr"
            else:
                field = "r." + field
            direction = params.get("direction", "asc")
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            filt = params.get("c_filter", {})
            in_st = []
            in_c = []
            in_c_w = []
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    "r.C_TOVAR like upper('%%')",
                ]
            )
            for i in range(len(search_re)):
                ts1 = "r.C_TOVAR like upper('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "r.C_TOVAR not like upper('%" + exclude[i].strip() + "%')"
                    stri.append("and %s" % ts3)
            stri = " ".join(stri)
            pars = {}
            pars["id_spr"] = filt.get("id_spr")
            pars["id_zavod"] = filt.get("id_zavod")
            pars["id_strana"] = filt.get("id_strana")
            pars["c_dv"] = filt.get("c_dv")
            pars["c_group"] = filt.get("c_group")
            pars["c_nds"] = filt.get("c_nds")
            pars["c_hran"] = filt.get("c_hran")
            pars["c_sezon"] = filt.get("c_sezon")
            pars["mandat"] = filt.get("mandat")
            pars["price"] = filt.get("price")
            pars["jv"] = filt.get("id_jv")
            pars["id_jv_id"] = filt.get("id_jv_id")
            pars["prescr"] = filt.get("prescr")
            pars["dt_ins"] = filt.get("dt_ins")
            pars["t_group"] = filt.get("t_group")
            dt = filt.get("dt")
            ssss = []
            if dt:
                pars["start_dt"] = dt.get("start")
                pars["end_dt"] = dt.get("end")
                if pars["start_dt"] and not pars["end_dt"]:
                    pars["start_dt"] = pars["start_dt"].split()[0]
                    s = """and (r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                    ssss.append(s.format(pars["start_dt"]))
                elif pars["start_dt"] and pars["end_dt"]:
                    pars["end_dt"] = pars["end_dt"].split()[0]
                    s = """and (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                    ssss.append(s.format(pars["start_dt"], pars["end_dt"]))
            in_st, in_c, in_c_w, ssss = self._gensSprJoins(pars, in_st, in_c, in_c_w, ssss)
            in_st.insert(
                0,
                f"""SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr,
nds, uhran, sezon, mandat, presc, r.DT, r.inprice, {'gr1' if pars['t_group'] else "'_'"},
r.jv, r.jv_id
FROM SPR r
join groups grr on r.id_spr = grr.cd_code and grr.cd_group = 'ZakMedCtg.1114'
and not exists (select llo.sh_prc from lnk llo where r.id_spr = llo.id_spr and llo.id_vnd = 51078) """,
            )
            sql = "\n".join(in_st)
            in_c.insert(
                0,
                """select count(*) from spr r
            join groups grr on r.id_spr = grr.cd_code and grr.cd_group = 'ZakMedCtg.1114'
and not exists (select llo.sh_prc from lnk llo where r.id_spr = llo.id_spr and llo.id_vnd = 51078) """,
            )
            sql_c = "\n".join(in_c)
            stri += " " + " ".join(ssss)
            sql += """\nWHERE {0}
ORDER by {1} {2}
"""
            sql = sql + self._insLimit(start_p, end_p)
            stri = stri.replace("r.C_TOVAR like upper('%%%%') and", "")
            stri = stri.replace("r.C_TOVAR like upper('%%') and", " ")
            sql_c += """ WHERE {0}""".format(stri)
            if in_c_w:
                sql_c = sql_c + " and " + " and ".join(in_c_w)
            sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%')", "")
            sql = sql.format(stri, field, direction)
            sql = sql.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            sql = sql.replace("WHERE r.C_TOVAR like upper('%%')", "")
            t1 = time.time() - st_t
            opt = ()
            _return = []
            st_t = time.time()
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            t2 = time.time() - t1 - st_t
            for row in result:
                r = {
                    "id_spr": row[0],
                    "c_tovar": row[1],
                    "id_dv": row[2],
                    "id_zavod": row[3],
                    "id_strana": row[4],
                    "c_dv": row[5],
                    "c_group": row[6],
                    "c_nds": row[7],
                    "c_hran": row[8],
                    "c_sezon": row[9],
                    "c_mandat": row[10],
                    "c_prescr": row[11],
                    "dt": str(row[12]),
                    "dt_ins": "",  # str(row[13]),
                    "price": row[13],
                    "t_group": "" if row[14] == "_" else row[14],
                    "id_jv": 1 if row[15] else 0,
                    "id_jv_id": 1 if row[16] else 0,
                }
                _return.append(r)

            _return = self._getInsDt(_return)

            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "time": (t1, t2),
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _gensSprJoins(self, pars, in_st, in_c, in_c_w, ssss):
        c_issue = pars.get("c_issue")
        print("c_issue 22", c_issue)
        if c_issue == 1 or c_issue == "1":
            s = """and (issue1 is not null and issue1 != '')"""
            ssss.append(s)
            pass
        elif c_issue == 2 or c_issue == "2":
            s = """and (issue1 is null or issue1 = '')"""
            ssss.append(s)
            pass
        sql_iss = """LEFT OUTER join
    (select g6.ID_SPR cc6, g6.ID_IS cg6, c6.C_ISSUE issue1
    from spr_issue g6
    inner join ISSUE c6 on (cast(g6.ID_IS as integer) = c6.ID)
    ) as ttt7 on (r.ID_SPR = cc6)"""
        in_c.insert(0, sql_iss)
        in_st.insert(0, sql_iss)
        if pars["id_spr"]:
            s = "and cast(r.id_spr as varchar(32)) like ('" + pars["id_spr"] + "%')"
            ssss.append(s)
        if str(pars["price"]) == "2":
            s = """and r.inprice is null or r.inprice = false"""
            ssss.append(s)
        elif str(pars["price"]) == "1":
            s = """and r.inprice = true"""
            ssss.append(s)
        if pars["jv"] == 1 or pars["jv"] == "1":
            s = """and r.jv = true"""
            ssss.append(s)
        elif pars["jv"] == 2 or pars["jv"] == "2":
            s = """and r.jv = false"""
            ssss.append(s)
        if pars["jv_fp"] == 1 or pars["jv_fp"] == "1":
            s = """and r.jv_fp = true"""
            ssss.append(s)
        elif pars["jv_fp"] == 2 or pars["jv_fp"] == "2":
            s = """and r.jv_fp = false"""
            ssss.append(s)

        if pars["id_strana"]:
            s = "join spr_strana s on (s.ID_SPR = r.ID_STRANA) and s.ID_SPR = {0}".format(pars["id_strana"])
            in_c.insert(0, s)
            in_st.insert(0, s)
        else:
            s = "LEFT join spr_strana s on (s.ID_SPR = r.ID_STRANA)"
            in_st.append(s)
        if pars["c_hran"]:
            if pars["c_hran"] != "-100":
                s = (
                    """join
            (select g2.CD_CODE cc2, c2.NM_GROUP uhran
            from GROUPS g2
            inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3 and c2.CD_GROUP = '%s'
            ) as eee1 on (cc2 = r.ID_SPR)"""
                    % pars["c_hran"]
                )
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """LEFT join
            (select g2.CD_CODE cc2, c2.NM_GROUP uhran
            from GROUPS g2
            inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3
            ) as eee2 on cc2 = r.ID_SPR"""
                in_st.append(s)
                in_c.append(s)
                ssss.append("and uhran is null")
        else:
            s = """LEFT join
            (select g2.CD_CODE cc2, c2.NM_GROUP uhran
            from GROUPS g2
            inner join CLASSIFIER c2 on (c2.CD_GROUP = g2.CD_GROUP) where c2.IDX_GROUP = 3
            ) as eee2 on (cc2 = r.ID_SPR)"""
            in_st.append(s)
        if pars["mandat"]:
            if (int(pars["mandat"])) == 1:
                s = """INNER join
                    (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                    from GROUPS g4
                    inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                    ) as eee3  on (cc4 = r.ID_SPR) and mandat is not null"""
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """left join
                    (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                    from GROUPS g4
                    inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                    ) as eeee1 on (cc4 = r.ID_SPR)"""
                in_c.append(s)
                in_st.append(s)
                ssss.append("and mandat is null")
        else:
            s = """left join
                (select g4.CD_CODE cc4, c4.NM_GROUP mandat
                from GROUPS g4
                inner join CLASSIFIER c4 on (c4.CD_GROUP = g4.CD_GROUP) where c4.IDX_GROUP = 4
                ) as eee4 on (cc4 = r.ID_SPR)"""
            in_st.append(s)
        if pars["prescr"]:
            if (int(pars["prescr"])) == 1:
                s = """INNER join
                    (select g5.CD_CODE cc5, c5.NM_GROUP presc
                    from GROUPS g5
                    inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5 and c5.cd_group = 'ZakMedCtg.16'
                    ) as eee5 on (cc5 = r.ID_SPR) and presc is not null"""
                in_c.insert(0, s)
                in_st.insert(0, s)
            elif (int(pars["prescr"])) == 3:
                s = """INNER join
                    (select g5.CD_CODE cc5, c5.NM_GROUP presc
                    from GROUPS g5
                    inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5 and c5.cd_group = 'a6c4ccf913304a7bb5ed04f02c2c4394'
                    ) as eee5 on (cc5 = r.ID_SPR) and presc is not null"""
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """left join
                    (select g5.CD_CODE cc5, c5.NM_GROUP presc
                    from GROUPS g5
                    inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                    ) as eee6 on (cc5 = r.ID_SPR)"""
                in_c.append(s)
                in_st.append(s)
                ssss.append("and presc is null")
        else:
            s = """left join
                (select g5.CD_CODE cc5, c5.NM_GROUP presc
                from GROUPS g5
                inner join CLASSIFIER c5 on (c5.CD_GROUP = g5.CD_GROUP) where c5.IDX_GROUP = 5
                ) as eee7 on (cc5 = r.ID_SPR)"""
            in_st.append(s)

        # //////////edit
        if pars["t_group"]:
            if pars["t_group"] != "-100":
                s = (
                    """join
            (select g.CD_CODE ccc, c.NM_GROUP gr1
            from GROUPS g
            inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 7 and c.CD_GROUP = '%s'
            ) as eee10 on (ccc = r.ID_SPR)"""
                    % pars["t_group"]
                )
                in_c.insert(0, s)
                in_st.insert(0, s)

        if pars["c_group"]:
            if pars["c_group"] != "-100":
                s = (
                    """join
            (select g.CD_CODE cc, c.NM_GROUP gr
            from GROUPS g
            inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1 and c.CD_GROUP = '%s'
            ) as eee8 on (cc = r.ID_SPR)"""
                    % pars["c_group"]
                )
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """left join
            (select g.CD_CODE cc, c.NM_GROUP gr
            from GROUPS g
            inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1
            ) as eee9 on (cc = r.ID_SPR)"""
                in_st.append(s)
                in_c.append(s)
                ssss.append("and gr is null")
        else:
            s = """LEFT join
            (select g.CD_CODE cc, c.NM_GROUP gr
            from GROUPS g
            inner join CLASSIFIER c on (c.CD_GROUP = g.CD_GROUP) where c.IDX_GROUP = 1
            ) as eee9 on (cc = r.ID_SPR)"""
            in_st.append(s)
        if pars["c_nds"]:
            if pars["c_nds"] != "-100":
                s = (
                    """join
            (select g1.CD_CODE cc1, c1.NM_GROUP nds
            from GROUPS g1
            inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2 and c1.CD_GROUP = '%s'
            ) as eee10 on (cc1 = r.ID_SPR)"""
                    % pars["c_nds"]
                )
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """LEFT join
            (select g1.CD_CODE cc1, c1.NM_GROUP nds
            from GROUPS g1
            inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2
            ) as eee11 on (cc1 = r.ID_SPR)"""
                in_st.append(s)
                in_c.append(s)
                ssss.append("and nds is null")
        else:
            s = """LEFT join
            (select g1.CD_CODE cc1, c1.NM_GROUP nds
            from GROUPS g1
            inner join CLASSIFIER c1 on (c1.CD_GROUP = g1.CD_GROUP) where c1.IDX_GROUP = 2
            ) as eee11 on (cc1 = r.ID_SPR)"""
            in_st.append(s)
        if pars["c_sezon"]:
            if pars["c_sezon"] != "-100":
                s = (
                    """join
            (select g3.CD_CODE cc3, c3.NM_GROUP sezon
            from GROUPS g3
            inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6 and c3.CD_GROUP = '%s'
            ) as eee12 on (cc3 = r.ID_SPR)"""
                    % pars["c_sezon"]
                )
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = """left join
            (select g3.CD_CODE cc3, c3.NM_GROUP sezon
            from GROUPS g3
            inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6
            ) as eee13 on (cc3 = r.ID_SPR)"""
                in_st.append(s)
                in_c.append(s)
                ssss.append("and sezon is null")
        else:
            s = """left join
            (select g3.CD_CODE cc3, c3.NM_GROUP sezon
            from GROUPS g3
            inner join CLASSIFIER c3 on (c3.CD_GROUP = g3.CD_GROUP) where c3.IDX_GROUP = 6
            ) as eee13 on (cc3 = r.ID_SPR)"""
            in_st.append(s)
        if pars["c_dv"]:
            if pars["c_dv"] != "-100":
                s = "join dv d on (d.ID = r.ID_DV) and d.ID = {0}".format(pars["c_dv"])
                in_c.insert(0, s)
                in_st.insert(0, s)
            else:
                s = "LEFT join dv d on d.ID = r.ID_DV"
                # in_c.insert(0, "LEFT join dv d on d.ID = r.ID_DV")
                in_st.append(s)
                in_c.append(s)
                ssss.append("and d.ID is null")
        else:
            s = "LEFT join dv d on (d.ID = r.ID_DV)"
            in_st.append(s)
        if pars["id_zavod"]:
            if pars["id_zavod"] == 999999999 or pars["id_zavod"] == "999999999":
                pars["id_zavod"] = 0
            s = "join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD) and z.ID_SPR = {0}".format(pars["id_zavod"])
            in_c.insert(0, s)
            in_st.insert(0, s)
        else:
            s = "LEFT join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)"
            in_st.append(s)
        return in_st, in_c, in_c_w, ssss

    def _createSqlGetSprSearchAdm(self, params):
        id_sprs = params.get("id_sprs")

        start_p = int(params.get("start", self.start))
        start_p = 1 if start_p < 1 else start_p
        end_p = int(params.get("count", self.count)) + start_p - 1
        field = params.get("field", "c_tovar")
        if field == "c_group":
            field = "gr"
        elif field == "id_zavod":
            field = "z.c_zavod"
        elif field == "id_strana":
            field = "s.c_strana"
        elif field == "c_dv":
            field = "d.act_ingr"
        else:
            field = "r." + field
        direction = params.get("direction", "asc")
        search_re = params.get("search", "")
        search_re = search_re.replace("'", "").replace('"', "")
        filt = params.get("c_filter", {})
        in_st = []
        in_c = []
        in_c_w = []
        exclude, search_re = self._form_exclude(search_re)
        search_re = search_re.split()
        stri = (
            []
            if len(search_re) > 0
            else [
                "r.C_TOVAR like upper('%%')",
            ]
        )
        for i in range(len(search_re)):
            ts1 = "r.C_TOVAR like upper('%" + search_re[i].strip() + "%')"
            if i == 0:
                stri.append(ts1)
            else:
                stri.append("and %s" % ts1)
        if len(exclude) > 0:
            for i in range(len(exclude)):
                ts3 = "r.C_TOVAR not like upper('%" + exclude[i].strip() + "%')"
                stri.append("and %s" % ts3)
        if id_sprs:
            id_sprs_tuple = []
            for i in id_sprs:
                try:
                    i = int(i)
                except Exception:
                    continue
                else:
                    id_sprs_tuple.append(i)
            id_sprs_tuple = tuple(id_sprs_tuple)
            stri.append(
                f"and r.id_spr in {str(id_sprs_tuple)}"
                if len(id_sprs_tuple) > 1
                else f"and r.id_spr = {id_sprs_tuple[0]}"
            )

        stri = " ".join(stri)
        pars = {}
        pars["id_spr"] = filt.get("id_spr")
        pars["id_zavod"] = filt.get("id_zavod")
        pars["id_strana"] = filt.get("id_strana")
        pars["c_dv"] = filt.get("c_dv")
        pars["c_group"] = filt.get("c_group")
        pars["c_nds"] = filt.get("c_nds")
        pars["c_hran"] = filt.get("c_hran")
        pars["c_sezon"] = filt.get("c_sezon")
        pars["mandat"] = filt.get("mandat")
        pars["jv"] = filt.get("id_jv")
        pars["jv_fp"] = filt.get("id_jv_fp")
        pars["price"] = filt.get("price")
        pars["prescr"] = filt.get("prescr")
        pars["dt_ins"] = filt.get("dt_ins")
        pars["t_group"] = filt.get("t_group")
        pars["c_issue"] = filt.get("c_issue")
        print("c_issue", pars["c_issue"])
        dt = filt.get("dt")
        ssss = []
        if dt:
            pars["start_dt"] = dt.get("start")
            pars["end_dt"] = dt.get("end")
            if pars["start_dt"] and not pars["end_dt"]:
                pars["start_dt"] = pars["start_dt"].split()[0]
                s = """and (r.DT > CAST('{0}' as TIMESTAMP) AND r.DT < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                ssss.append(s.format(pars["start_dt"]))
            elif pars["start_dt"] and pars["end_dt"]:
                pars["end_dt"] = pars["end_dt"].split()[0]
                s = """and (r.DT >= CAST('{0}' as TIMESTAMP) AND r.DT <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                ssss.append(s.format(pars["start_dt"], pars["end_dt"]))

        in_st, in_c, in_c_w, ssss = self._gensSprJoins(pars, in_st, in_c, in_c_w, ssss)

        in_st.insert(
            0,
            f"""SELECT r.ID_SPR, r.C_TOVAR, r.ID_DV, z.C_ZAVOD, s.C_STRANA, d.ACT_INGR, gr, nds, uhran,
sezon, mandat, presc, r.DT, r.inprice, {'gr1' if pars['t_group'] else "'_'"}, u."USER",
case
WHEN nc.nom_name is null or nc.nom_name = '' then ''
else r.id_521 || ' - ' || nc.nom_name
end,
r.jv,
r.jv_fp,
issue1
FROM SPR r
left join nom_codes nc on (nc.code = r.id_521)
left join users u on (r.ID_OWNER=u.id)
""",
        )
        sql = "\n".join(in_st)
        in_c.insert(0, """select count(*) from spr r""")
        sql_c = "\n".join(in_c)
        stri += " " + " ".join(ssss)

        sql += """\nWHERE {0}
ORDER by {1} {2}"""
        sql = sql + self._insLimit(start_p, end_p)
        stri = stri.replace("r.C_TOVAR like upper('%%%%') and", "")
        stri = stri.replace("r.C_TOVAR like upper('%%') and", "")
        sql_c += """ WHERE {0}""".format(stri)
        if in_c_w:
            sql_c = sql_c + " and " + " and ".join(in_c_w)
        sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
        sql_c = sql_c.replace("WHERE r.C_TOVAR like upper('%%')", "")
        sql = sql.format(stri, field, direction)
        sql = sql.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
        sql = sql.replace("WHERE r.C_TOVAR like upper('%%')", "")
        return [sql, sql_c]

    def getIdSprSearchAdm(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            _, sql_c = self._createSqlGetSprSearchAdm(params)
            sql_c = sql_c.replace("count(*)", "r.id_spr")
            t1 = time.time() - st_t
            result = self._make_sql({"sql": sql_c, "opt": ()})
            _return = []
            for row in result:
                _return.append(row[0])
            ret = {"result": True, "ret_val": _return, "time": t1}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprSearchAdm(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            sql, sql_c = self._createSqlGetSprSearchAdm(params)
            print("*" * 15)
            print(sql)
            print("*" * 15)
            t1 = time.time() - st_t
            opt = ()
            _return = []
            st_t = time.time()
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            t2 = time.time() - t1 - st_t
            for row in result:
                r = {
                    "id_spr": row[0],
                    "c_tovar": row[1],
                    "id_dv": row[2],
                    "id_zavod": row[3],
                    "id_strana": row[4],
                    "c_dv": row[5],
                    "c_group": row[6],
                    "c_nds": row[7],
                    "c_hran": row[8],
                    "c_sezon": row[9],
                    "c_mandat": row[10],
                    "c_prescr": row[11],
                    "dt": str(row[12]),
                    "dt_ins": "",  # str(row[13])
                    "price": row[13],
                    "t_group": "" if row[14] == "_" else row[14],
                    "owner": row[15] or "",
                    "id_521": row[16],
                    "id_jv": 1 if row[17] else 0,
                    "id_jv_fp": 1 if row[18] else 0,
                    "c_issue": row[19],
                }
                _return.append(r)
            if params.get("count", 0) < 100000000:
                _return = self._getInsDt(_return)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "time": (t1, t2),
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _getInsDt(self, _return):
        sql_dt = """select min(l.dt) as aa, s.id_spr as idd
from spr s
join lnk l on l.id_spr = s.id_spr
where s.id_spr = %s
group by s.id_spr;"""
        dt_ins = []
        for row in _return:
            dt_ins.append({"sql": sql_dt, "opt": (int(row["id_spr"]),)})
        if len(dt_ins) > 0:
            pool = ThreadPool(len(dt_ins))
            res_dt = pool.map(self._make_sql, dt_ins)
            pool.close()
            pool.join()
            for i, r in enumerate(res_dt):
                _return[i]["dt_ins"] = str(r[0][0]) if r else ""
        return _return

    def getSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            id_spr = int(params.get("id_spr"))
            if id_spr:
                sql = """SELECT r.ID_SPR, r.C_TOVAR, r.ID_STRANA, r.ID_ZAVOD, r.ID_DV, z.C_ZAVOD, s.C_STRANA,
d.ACT_INGR, gr, i_gr, nds, i_nds, uhran, i_uhran,
sezon, i_sezon,
mandat, presc, issue1, u."USER",
case
    WHEN nc.nom_name is null or nc.nom_name = '' then ''
    else r.id_521 || ' - ' || nc.nom_name
end,
r.jv,
i_presc,
r.jv_fp
FROM SPR r
left join nom_codes nc on (nc.code = r.id_521)
left join users u on (u.ID=r.ID_OWNER)
LEFT OUTER join spr_zavod z on (r.ID_ZAVOD = z.ID_SPR)
LEFT OUTER join spr_strana s on (r.ID_STRANA = s.ID_SPR)
LEFT OUTER join dv d on (r.ID_DV = d.ID)
LEFT OUTER join
    (select g.CD_CODE cc, g.CD_GROUP cg, c.NM_GROUP gr, c.CD_group i_gr
    from GROUPS g
    inner join CLASSIFIER c on (g.CD_GROUP = c.CD_GROUP) where c.IDX_GROUP = 1
    ) as ttt1 on (r.ID_SPR = cc)
LEFT OUTER join
    (select g1.CD_CODE cc1, g1.CD_GROUP cg1, c1.NM_GROUP nds, c1.CD_group i_nds
    from GROUPS g1
    inner join CLASSIFIER c1 on (g1.CD_GROUP = c1.CD_GROUP) where c1.IDX_GROUP = 2
    ) as  ttt2 on (r.ID_SPR = cc1)
LEFT OUTER join
    (select g2.CD_CODE cc2, g2.CD_GROUP cg2, c2.NM_GROUP uhran, c2.CD_GROUP i_uhran
    from GROUPS g2
    inner join CLASSIFIER c2 on (g2.CD_GROUP = c2.CD_GROUP) where c2.IDX_GROUP = 3
    ) as ttt3 on (r.ID_SPR = cc2)
LEFT OUTER join
    (select g3.CD_CODE cc3, g3.CD_GROUP cg3, c3.NM_GROUP sezon, c3.CD_GROUP i_sezon
    from GROUPS g3
    inner join CLASSIFIER c3 on (g3.CD_GROUP = c3.CD_GROUP) where c3.IDX_GROUP = 6
    ) as ttt4 on (r.ID_SPR = cc3)
LEFT OUTER join
    (select g4.CD_CODE cc4, g4.CD_GROUP cg4, c4.NM_GROUP mandat
    from GROUPS g4
    inner join CLASSIFIER c4 on (g4.CD_GROUP = c4.CD_GROUP) where c4.IDX_GROUP = 4
    ) as ttt5 on (r.ID_SPR = cc4)
LEFT OUTER join
    (select g5.CD_CODE cc5, g5.CD_GROUP cg5, c5.NM_GROUP presc, c5.CD_GROUP i_presc
    from GROUPS g5
    inner join CLASSIFIER c5 on (g5.CD_GROUP = c5.CD_GROUP) where c5.IDX_GROUP = 5
    ) as ttt6 on (r.ID_SPR = cc5)
LEFT OUTER join
    (select g6.ID_SPR cc6, g6.ID_IS cg6, c6.C_ISSUE issue1
    from spr_issue g6
    inner join ISSUE c6 on (cast(g6.ID_IS as integer) = c6.ID)
    ) as ttt7 on (r.ID_SPR = cc6)
WHERE r.id_spr = %s"""
                opt = (id_spr,)
                _return = []
                result = self.db.request({"sql": sql, "options": opt})
                for row in result:
                    r = {
                        "id_spr": row[0],
                        "c_tovar": row[1],
                        "id_strana": row[2] or "",
                        "c_dv": row[7] or "",
                        "c_zavod": row[5] or "",
                        "c_strana": row[6] or "",
                        "id_zavod": row[3] or "",
                        "id_dv": row[4] or "",
                        "barcode": "",
                        "prescr": row[17],
                        "id_prescr": row[22],
                        "_prescr": 1 if row[17] else 0,
                        "_mandat": 1 if row[16] else 0,
                        "issue": row[18],
                        "sezon": row[14],
                        "id_sezon": row[15],
                        "usloviya": row[12],
                        "id_usloviya": row[13],
                        "group": row[8],
                        "id_group": row[9],
                        "id_nds": row[11],
                        "nds": row[10],
                        "c_tgroup": "",
                        "id_tgroup": "",
                        "owner": row[19] or "",
                        "id_521": row[20],
                        "id_jv": 1 if row[21] else 0,
                        "id_jv_id": 1 if row[23] else 0,
                    }
                    sql = """select r.barcode from spr_barcode r where r.id_spr = %s"""
                    t = self.db.request({"sql": sql, "options": opt})
                    b_code = []
                    for row_b in t:
                        b_code.append(row_b[0])
                    r["barcode"] = " ".join(b_code)
                    sql = """select s.C_ISSUE
from SPR_ISSUE r
JOIN ISSUE s on s.ID = cast(r.ID_IS as integer)
where r.id_spr =%s"""
                    t = self.db.request({"sql": sql, "options": opt})
                    b_code = []
                    for row_b in t:
                        b_code.append(row_b[0])
                    r["issue"] = "; ".join(b_code) + ("; " if len(t) > 1 else "")
                    sql = """select classifier.nm_group, classifier.cd_group, classifier.idx_group from groups
inner join classifier on (groups.cd_group = classifier.cd_group)
where ( classifier.idx_group = 7 and groups.cd_code = %s )"""
                    t = self.db.request({"sql": sql, "options": opt})
                    try:
                        c_t = []
                        for row_g in t:
                            c_t.append(row_g[0])
                        r["c_tgroup"] = "; ".join(c_t)
                    except Exception:
                        pass
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "id_spr error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getSprLnks(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            total_table = params.get("total")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "c_tovar")
            direction = params.get("direction", "asc")
            s_field = None
            s_direction = None
            if field == "c_vnd" or field == "id_tovar":
                s_field = field
                s_direction = direction
                field = "c_tovar"
                direction = "asc"
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            sti = "r.C_TOVAR like '%%'"
            filt = params.get("c_filter")
            pref = "and %s"
            stri_1 = ""
            ins_ch_date = None
            if filt:
                pars = {}
                pars["c_vnd"] = filt.get("c_vnd")
                pars["c_zavod"] = filt.get("c_zavod")
                pars["c_tovar"] = filt.get("c_tovar")
                pars["owner"] = filt.get("owner")
                dt = filt.get("dt")
                ssss = []
                s_1 = []
                if dt:
                    pars["start_dt"] = dt.get("start")
                    pars["end_dt"] = dt.get("end")
                    if pars["start_dt"] and not pars["end_dt"]:
                        pars["start_dt"] = pars["start_dt"].split()[0]
                        s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ins_ch_date = ") as foo where %s" % s.format(pars["start_dt"])
                    elif pars["start_dt"] and pars["end_dt"]:
                        pars["end_dt"] = pars["end_dt"].split()[0]
                        s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval'1 day') as timestamp))"""
                        ins_ch_date = ") as foo where %s" % s.format(pars["start_dt"], pars["end_dt"])
                if pars["c_vnd"]:
                    s = "v.ID_VND in ({0})".format(pars["c_vnd"])
                    ssss.append(pref % s)
                if pars["owner"]:
                    s = "lower(r.owner) like lower('%" + pars["owner"] + "%')"
                    ssss.append(pref % s)
                if pars["c_tovar"]:
                    s = "r.C_TOVAR like upper('%" + pars["c_tovar"] + "%')"
                    ssss.append(pref % s)
                if pars["c_zavod"]:
                    s = "lower(r.C_ZAVOD) like lower('%" + pars["c_zavod"] + "%')"
                    s1 = "lower(z.C_ZAVOD) like lower('%" + pars["c_zavod"] + "%')"
                    s_1.append(pref % s1)
                    ssss.append(pref % s)
                stri_1 = " ".join(ssss)
                s_1 = " ".join(s_1)
            exclude, search_re = self._form_exclude(search_re)
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                search_text = search_re[i].strip()
                ts1 = "r.C_TOVAR like upper('%" + search_text + "%')"
                if search_text.isdigit():
                    ts1 = f"""({ts1} or r.ID_SPR::text like '%{search_text}%' )"""
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            if len(exclude) > 0:
                for i in range(len(exclude)):
                    ts3 = "r.C_TOVAR not like upper('%" + exclude[i].strip() + "%')"
                    stri.append("and %s" % ts3)
            stri = " ".join(stri) + " " + s_1
            stri = stri.replace("r.C_TOVAR like upper('%%%%') and", "")
            sql = """select r.id_spr, r.c_tovar, z.c_zavod, s.c_strana
from spr r
LEFT join spr_strana s on (s.ID_SPR = r.ID_STRANA)
LEFT join spr_zavod z on (z.ID_SPR = r.ID_ZAVOD)
WHERE {0}
order by r.{1} {2}
""".format(
                stri, field, direction
            )
            if ins_ch_date:
                sql = "select * from (" + sql + ins_ch_date
            sql_c = "select count(*) from ( " + sql + ") as foobar"
            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE r.C_TOVAR like upper('%%%%')", "")
            t1 = time.time() - st_t
            opt = ()
            _return = []
            st_t = time.time()
            p_list = (
                [
                    {"sql": sql, "opt": opt},
                ]
                if total_table
                else [{"sql": sql, "opt": opt}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                st1 = " | ".join([str(row[0]), row[1]])
                r = {
                    "id": row[0],
                    "$row": "c_tovar",
                    "open": False,
                    "c_tovar": st1 if row[2] is None else " | ".join([st1, row[2]]),
                    "data": [],
                }
                if s_field == "c_vnd":
                    orderby = "order by v.{0} {1}".format(s_field, s_direction)
                elif s_field == "id_tovar":
                    orderby = "order by r.{0} {1}".format(s_field, s_direction)
                else:
                    orderby = "order by r.C_TOVAR ASC"
                sql = f"""SELECT r.SH_PRC, v.C_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.OWNER,
    CASE
    WHEN r.CHANGE_DT is null THEN r.DT
    ELSE r.CHANGE_DT
    END as ch_date
FROM LNK r
LEFT JOIN VND v on (r.ID_VND = v.ID_VND)
WHERE r.ID_SPR = {row[0]}"""
                sql += """ {0} {1}""".format(stri_1, orderby)
                opt = (row[0],)
                opt = None
                res = self.db.request({"sql": sql, "options": opt})
                for rrr in res:
                    rr = {
                        "id": rrr[0],
                        "c_vnd": rrr[1],
                        "id_tovar": rrr[2],
                        "c_tovar": rrr[3],
                        "c_zavod": rrr[4],
                        "dt": str(rrr[6]),
                        "owner": rrr[5],
                        "count": "",
                    }
                    r["data"].append(rr)
                r["count"] = "" if len(r["data"]) == 0 else len(r["data"])
                _return.append(r)
            t3 = time.time() - st_t
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "time": (t1, t3),
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLnkSprs(self, params=None, x_hash=None):
        sort_replace = {
            "dt": "ch_date",
            "c_tovar": "rct",
            "id_spr": "rids",
            "owner": "ro",
        }
        if self._check(x_hash):
            total_table = params.get("total")
            user = params.get("user")
            start_p = int(params.get("start", self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get("count", self.count)) + start_p - 1
            field = params.get("field", "dt")  # было c_tovar
            field = sort_replace.get(field)
            direction = params.get("direction", "desc")  # было asc
            search_re = params.get("search")
            search_re = search_re.replace("'", "").replace('"', "")
            sti = """lower(r.C_TOVAR) like lower('%%')"""
            filt = params.get("c_filter")
            search_re = search_re.split()
            stri = (
                []
                if len(search_re) > 0
                else [
                    sti,
                ]
            )
            for i in range(len(search_re)):
                ts1 = f"""lower(r.C_TOVAR) like lower('%{search_re[i].strip()}%')"""
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append("and %s" % ts1)
            in_st = []
            ssss = []
            ins_ch_date = None
            stri = " ".join(stri)
            if filt:
                pars = {}
                pars["c_vnd"] = filt.get("c_vnd")
                pars["c_zavod"] = filt.get("c_zavod")
                pars["c_tovar"] = filt.get("c_tovar")
                pars["owner"] = filt.get("owner")
                pars["spr"] = filt.get("spr")
                pars["id_tovar"] = filt.get("id_tovar")
                pars["id_spr"] = filt.get("id_spr")
                pars["hash"] = filt.get("id")
                pars["source"] = filt.get("source")
                try:
                    pars["id_spr"] = int(pars["id_spr"])
                except Exception:
                    pars["id_spr"] = None
                if not pars["owner"]:
                    sql = """SELECT r.ID_ROLE FROM USERS r WHERE r."USER" = %s"""
                    opt = (user,)
                    id_role = self.db.request({"sql": sql, "options": opt})[0][0]
                    if id_role not in (10, 34):
                        pars["owner"] = user
                dt = filt.get("dt")
                if dt:
                    pars["start_dt"] = dt.get("start")
                    pars["end_dt"] = dt.get("end")
                    if pars["start_dt"] and not pars["end_dt"]:
                        pars["start_dt"] = pars["start_dt"].split()[0]
                        s = """(ch_date > CAST('{0}' as TIMESTAMP) AND ch_date < cast((CAST('{0}' as TIMESTAMP) + interval '1 day') as timestamp))"""
                        ins_ch_date = "and %s" % s.format(pars["start_dt"])
                    elif pars["start_dt"] and pars["end_dt"]:
                        pars["end_dt"] = pars["end_dt"].split()[0]
                        s = """(ch_date >= CAST('{0}' as TIMESTAMP) AND ch_date <= cast((CAST('{1}' as TIMESTAMP) + interval '1 day') as timestamp))"""
                        ins_ch_date = "and %s" % s.format(pars["start_dt"], pars["end_dt"])
                if pars["c_tovar"]:
                    s = f"""lower(r.C_TOVAR) like lower('%{pars['c_tovar']}%')"""
                    ssss.append("and %s" % s)
                if pars["id_spr"]:
                    s = "cast(r.id_spr as text) like '" + str(pars["id_spr"]) + "%'"
                    ssss.append("and %s" % s)
                if pars["id_tovar"]:
                    if pars["id_tovar"].endswith(" "):
                        pars["id_tovar"] = pars["id_tovar"].strip()
                        s = f"lower(r.id_tovar)  = lower('{pars['id_tovar']}')"
                    else:
                        s = "lower(r.id_tovar) like lower('%" + pars["id_tovar"] + "%')"
                    ssss.append("and %s" % s)
                if pars["owner"]:
                    s = f"""lower(r.OWNER) like lower('%{pars['owner']}%')"""
                    ssss.append("and %s" % s)
                if pars["c_zavod"]:
                    s = f"""lower(r.C_ZAVOD) like lower('%{pars['c_zavod']}%')"""
                    ssss.append("and %s" % s)
                if pars["hash"]:
                    s = f"r.SH_PRC like '{pars['hash']}%'"
                    ssss.append("and %s" % s)
                if pars["source"]:
                    if 0 == int(pars["source"]):
                        s = "(r.SOURCE is null or r.SOURCE = 0) "
                    else:
                        s = "r.SOURCE = " + pars["source"]
                    ssss.append("and %s" % s)
                if pars["spr"]:
                    qwe = pars.get("spr")
                    exclude, qwe = self._form_exclude(qwe)
                    qwe = qwe.split()
                    sq = []
                    if len(exclude) > 0:
                        for i in range(len(qwe)):
                            s = f""" and lower(s.C_TOVAR) like lower('%{qwe[i].strip()}%')"""
                            sq.append("and %s" % s)
                        for i in range(len(exclude)):
                            s = " and lower(s.C_TOVAR) not like lower('%" + exclude[i].strip() + "%')"
                            sq.append(s)
                        sq_s = (
                            "JOIN SPR s on (s.ID_SPR = rids) "
                            + " ".join(sq)
                            + "\nleft join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"
                        )
                        in_st.append(sq_s)
                    else:
                        for i in range(len(qwe)):
                            s = f"""lower(s.C_TOVAR) like lower('%{qwe[i].strip()}%')"""
                            sq.append("and %s" % s)
                        sq_s = (
                            "JOIN SPR s on (s.ID_SPR = rids) "
                            + " ".join(sq)
                            + "\nleft join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"
                        )
                        in_st.insert(0, sq_s)
                else:
                    s = """left JOIN SPR s on (s.ID_SPR = rids)
left join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"""
                    in_st.append(s)
                if pars["c_vnd"]:
                    s = f"""JOIN VND v on (v.ID_VND = ridv) and v.ID_VND in ({pars['c_vnd']})"""
                    in_st.insert(0, s)
                else:
                    s = "left JOIN VND v on (v.ID_VND = ridv)"
                    in_st.append(s)
                in_st.insert(
                    0,
                    """SELECT rsh, v.C_VND, ridt, rct, rcv, rdt, ro, rchd, rids, s.C_TOVAR, ch_date, z.C_ZAVOD, rsou
from (
    SELECT r.SH_PRC rsh, r.ID_TOVAR ridt, r.C_TOVAR rct, r.C_ZAVOD rcv, r.DT rdt, r.OWNER ro, r.CHANGE_DT rchd, r.ID_SPR rids, r.ID_VND ridv,
        ch_date,
        r.SOURCE rsou
        FROM LNK r
            ,LATERAL (select CASE
            WHEN r.CHANGE_DT is null THEN r.DT
            ELSE r.CHANGE_DT
            END ) AS s1(ch_date)
        {0}
    ) as rrrr""",
                )
                sql = "\n".join(in_st)
                stri += " " + " ".join(ssss)
            else:
                raise Exception("Отсутсвует c_filt в getLnkSprs")
            stri += ins_ch_date or ""
            stri = stri.replace("lower(r.C_TOVAR) like lower('%%')", "1=1")
            sql_c = sql.format("""\nWHERE {0}\n""")
            sql_m = sql_c + """ ORDER by {1} {2}\n"""
            sql_c = sql_c.format(stri)
            sql_c = "select count(*) from ( " + sql_c + ") as foobar"
            sql_m = sql_m.format(stri, field, direction)
            sql_m = sql_m + self._insLimit(start_p, end_p)
            _return = []
            p_list = (
                [
                    {"sql": sql_m, "opt": ()},
                ]
                if total_table
                else [{"sql": sql_m, "opt": ()}, {"sql": sql_c, "opt": ()}]
            )
            pool = ThreadPool(len(p_list))
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            count = total_table or results[1][0][0]
            result = results[0]
            for row in result:
                if str(row[12]) == "1":
                    sou = "PLExpert"
                elif str(row[12]) == "2":
                    sou = "Склад"
                elif str(row[12]) == "3":
                    sou = "Агент"
                elif str(row[12]) == "4":
                    sou = "edocs"
                else:
                    sou = "Без источника"
                r = {
                    "id": row[0],
                    "c_vnd": row[1],
                    "id_tovar": row[2],
                    "c_tovar": row[3],
                    "c_zavod": row[4],
                    "dt": str(row[10]),
                    "owner": row[6],
                    "id_spr": row[8],
                    "spr": row[9],
                    "e_zavod": row[11],
                    "source": sou,
                }
                _return.append(r)
            ret = {
                "result": True,
                "ret_val": {
                    "datas": _return,
                    "total": count,
                    "start": start_p,
                    "params": params,
                },
            }
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get("sh_prc")
            id_spr = params.get("id_spr")
            user = params.get("user")
            if sh_prc and id_spr:
                sql = """delete from PRC r WHERE r.sh_prc = %s returning r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.SOURCE"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})
                result = result[0]
                sql = """insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER, SOURCE)
values (%s, %s, %s,
%s, %s, %s, CAST('NOW' AS TIMESTAMP), %s, %s) """
                opt = (
                    result[0],
                    id_spr,
                    result[1],
                    result[2],
                    result[3],
                    result[4],
                    user,
                    result[6],
                )
                self.db.execute({"sql": sql, "options": opt})
                msg = {
                    "sh_prc": opt[0],
                    "id_spr": opt[1],
                    "id_vnd": opt[2],
                    "id_tovar": opt[3],
                    "c_tovar": opt[4],
                    "c_zavod": opt[5],
                    "source": opt[6],
                }
                self.db.ch_log(user=user, m_type="insert_lnk", msg=msg)
                ret = {"result": True, "ret_val": result[0]}
            else:
                ret = {"result": False, "ret_val": "hash absent"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get("sh_prc")
            action = params.get("action")
            user = params.get("user")
            if sh_prc and action in ("return", "delete"):
                sql = """delete from lnk r WHERE sh_prc = %s returning r.SH_PRC, r.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, r.DT, r.OWNER, r.SOURCE"""
                opt = (sh_prc,)
                result = self.db.execute({"sql": sql, "options": opt})[0]
                msg = {
                    "sh_prc": result[0],
                    "id_spr": result[1],
                    "id_vnd": result[2],
                    "id_tovar": result[3],
                    "c_tovar": result[4],
                    "c_zavod": result[5],
                    "owner": result[7],
                    "source": result[8],
                }
                if action == "return":
                    sql = """insert into PRC
(SH_PRC, ID_VND, ID_TOVAR, N_FG, N_CENA, C_TOVAR, C_ZAVOD, ID_ORG, C_INDEX, DT, IN_WORK, SOURCE)
values (%s, %s, %s,
%s, %s, %s,
%s, %s, %s, CAST('NOW' AS TIMESTAMP),
%s, %s)"""
                    opt = (
                        result[0],
                        result[2],
                        result[3],
                        12,
                        0,
                        result[4],
                        result[5],
                        0,
                        0,
                        -1,
                        result[8],
                    )
                    m_type = "return_lnk"
                else:
                    sql = """insert into R_LNK
(SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER, DT_R, USER_R)
values (%s, %s, %s,
%s, %s, %s, %s,
%s,  CAST('NOW' AS TIMESTAMP),
(select ID from USERS where "USER" = %s) )"""
                    opt = (
                        result[0],
                        result[1],
                        result[2],
                        result[3],
                        result[4],
                        result[5],
                        result[6],
                        result[7],
                        user,
                    )
                    m_type = "delete_lnk"
                self.db.execute({"sql": sql, "options": opt})
                self.db.ch_log(user=user, m_type=m_type, msg=msg)
                ret = {"result": True, "ret_val": result[0]}
            else:
                ret = {"result": False, "ret_val": "hash absent"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def returnLnk(self, params=None, x_hash=None):
        if self._check(x_hash):
            sh_prc = params.get("sh_prc")
            # user = params.get('user')
            if sh_prc:
                sql = """update PRC set N_FG = 0, ID_ORG = 0, IN_WORK = -1, DT = current_timestamp where SH_PRC = %s returning SH_PRC, N_FG"""
                opt = (sh_prc,)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                for row in result:
                    r = {"sh_prc": row[0]}
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "hash error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def skipLnk(self, params=None, x_hash=None):
        # n_fg = 1 пропустить
        # n_fg = users."GROUP", id_org = 0 на админа назначить
        if self._check(x_hash):
            sh_prc = params.get("sh_prc")
            user = params.get("user")
            sql = """SELECT r."GROUP", r.ID FROM USERS r where r."USER" = %s"""
            opt = (user,)
            gr_id, user_id = self.db.request({"sql": sql, "options": opt})[0]
            iid = 1 if gr_id == 0 or gr_id == 999999 else user_id
            sss = "" if gr_id == 0 else ", id_org = 0"
            if sh_prc:
                sql = f"""update PRC set N_FG = %s {sss}, IN_WORK = -1 where SH_PRC = %s returning SH_PRC, N_FG"""
                opt = (iid, sh_prc)
                _return = []
                result = self.db.execute({"sql": sql, "options": opt})
                for row in result:
                    r = {"sh_prc": row[0]}
                    _return.append(r)
                ret = {"result": True, "ret_val": _return}
            else:
                ret = {"result": False, "ret_val": "hash error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getRoles(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.ID, r.NAME FROM ROLES r"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id": 1 if row[0] == 0 else row[0],
                    "r_name": row[1],
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genSupplSql(self, process, item):
        code = item.get("code")
        int_id = item.get("int_id")
        name = item.get("name")
        inn = item.get("inn", "")
        owner = item.get("owner")
        if int_id:
            sql = """UPDATE LNK_CODES
SET (PROCESS, NAME, CODE, INN, OWNER) = (%s, %s, %s, %s, %s) where id = %s;"""
            options = (process, name, code, inn, owner, int_id)
        else:
            sql = """insert into LNK_CODES (PROCESS, NAME, CODE, INN, OWNER) values (%s, %s, %s, %s, %s)"""
            options = (process, name, code, inn, owner)
        return {"sql": sql, "opt": options}

    def setLinkSuppl(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            data = params.get("data")
            if data:
                restrict = data.get("l")
                right = data.get("r")
                params = []
                for item in restrict:
                    params.append(self._genSupplSql(0, item))
                for item in right:
                    params.append(self._genSupplSql(1, item))
                pool = ThreadPool(len(params))
                pool.map(self._make_sql, params)
                pool.close()
                pool.join()
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLinkSuppl1(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            data = params.get("data")
            for row in data:
                if row.get("change") == 1:  # удаленная позиция
                    opt = (row.get("code"),)
                    sql = """delete from LNK_CODES where CODE=%s"""
                elif row.get("change") == 50:  # измененная позиция
                    opt = (
                        row.get("process"),
                        row.get("name"),
                        row.get("inn"),
                        user,
                        row.get("code"),
                    )
                    sql = """update LNK_CODES set PROCESS =%s,
NAME=%s, INN=%s, OWNER=%s where CODE=%s"""
                elif row.get("change") == 2:  # новая позиция или измененная позиция
                    opt = (
                        row.get("process"),
                        row.get("name"),
                        row.get("code"),
                        row.get("inn"),
                        user,
                    )
                    opt = opt + opt
                    sql = """insert into LNK_CODES (PROCESS, NAME, CODE, INN, OWNER) values (%s, %s, %s, %s, %s)
ON CONFLICT (CODE) DO UPDATE
SET PROCESS = %s, NAME = %s, CODE = %s, INN = %s, OWNER = %s;"""
                self.db.execute({"sql": sql, "options": opt})
            ret = json.loads(self.getLinkSuppl1(params, x_hash))
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLinkCodes(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            data = params.get("data")
            sql_template = """update vnd set permit = %s where id_vnd in (%s);"""
            if data:
                permit = data.get("p")
                restrict = data.get("r")
                p_list = []
                r_list = []
                for item in permit:
                    p_list.append(int(item.get("id_vnd")))
                for item in restrict:
                    r_list.append(int(item.get("id_vnd")))
                params = []
                if p_list:
                    a = {
                        "sql": sql_template % ("1", f"{','.join([str(i) for i in p_list])}"),
                        "opt": (),
                    }
                    params.append(a)
                if r_list:
                    a = {
                        "sql": sql_template % ("2", f"{','.join([str(i) for i in r_list])}"),
                        "opt": (),
                    }
                    params.append(a)
                pool = ThreadPool(len(params))
                pool.map(self._make_sql, params)
                pool.close()
                pool.join()
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkCodes(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.id_vnd, r.c_vnd, r.permit FROM vnd r order by r.c_vnd;"""
            opt = ()
            _rp = []
            _rr = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "id_vnd": row[0],
                    "c_vnd": row[1],
                }
                if int(row[2]) == 1:
                    _rp.append(r)
                else:
                    _rr.append(r)
            ret = {"result": True, "ret_val": {"p": _rp, "r": _rr}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkSuppl(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.PROCESS, r.CODE, r.NAME, r.INN, r.OWNER, r.ID FROM LNK_CODES r ORDER BY r.CODE"""
            opt = ()
            _rp = []
            _rr = []
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "process": row[0],
                    "code": row[1],
                    "name": row[2],
                    "inn": row[3],
                    "owner": row[4],
                    "int_id": row[5],
                }
                if int(r["process"]) == 1:
                    _rp.append(r)
                else:
                    _rr.append(r)
                _return.append(r)
            ret = {"result": True, "ret_val": {"p": _rp, "r": _rr}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkSuppl1(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.PROCESS, r.CODE, r.NAME, r.INN, r.OWNER FROM LNK_CODES r ORDER BY r.CODE"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "process": row[0],
                    "code": row[1],
                    "name": row[2],
                    "inn": row[3],
                    "owner": row[4],
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genEcxludesSql(self, process, item):
        opt_start = item.get("options_st")
        opt_in = item.get("options_in")
        if opt_start is True:
            opt_start = 1
        elif opt_start is False:
            opt_start = 0
        if opt_in is True:
            opt_in = 1
        elif opt_in is False:
            opt_in = 0
        opt_txt = str(opt_start) + str(opt_in)
        int_id = item.get("int_id")
        name = item.get("name")
        owner = item.get("owner")
        if int_id:
            sql = """UPDATE LNK_EXCLUDES
SET (PROCESS, NAME, OPTIONS, OWNER) = (%s, %s, %s, %s) where id = %s;"""
            options = (process, name, opt_txt, owner, int_id)
        else:
            sql = """insert into LNK_EXCLUDES (PROCESS, NAME, OPTIONS, OWNER)
values (%s, %s, %s, %s)"""
            options = (process, name, opt_txt, owner)
        return {"sql": sql, "opt": options}

    def setLinkExcludes(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            data = params.get("data")
            if data:
                left = data.get("l")
                right = data.get("r")
                params = []
                for item in left:
                    params.append(self._genEcxludesSql(1, item))
                for item in right:
                    params.append(self._genEcxludesSql(0, item))
                pool = ThreadPool(len(params))
                pool.map(self._make_sql, params)
                pool.close()
                pool.join()
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setLinkExcludes1(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get("user")
            data = params.get("data")
            for row in data:
                if row.get("change") == 1:  # удаленная позиция
                    sql = """delete from LNK_EXCLUDES where NAME=%s"""
                    opt = (row.get("name"),)
                elif row.get("change") == 2:  # новая позиция или измененная позиция
                    opt_start = row.get("options_st")
                    opt_in = row.get("options_in")
                    if opt_start is True:
                        opt_start = 1
                    elif opt_start is False:
                        opt_start = 0
                    if opt_in is True:
                        opt_in = 1
                    elif opt_in is False:
                        opt_in = 0
                    process = row.get("process")
                    if process is True:
                        process = 1
                    elif process is False:
                        process = 0
                    opt_txt = str(opt_start) + str(opt_in)
                    opt = (process, row.get("name"), opt_txt, user)
                    sql = """insert into LNK_EXCLUDES (PROCESS, NAME, OPTIONS, OWNER)
values (%s, %s, %s, %s) ON CONFLICT (NAME) DO UPDATE
SET (PROCESS, NAME, OPTIONS, OWNER) = (%s, %s, %s, %s);"""
                    opt = opt + opt
                self.db.execute({"sql": sql, "options": opt})
            ret = json.loads(self.getLinkExcludes(params, x_hash))
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getLinkExcludes(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get('user')
            sql = """SELECT r.PROCESS, r.NAME, r.OPTIONS, r.OWNER, r.ID FROM LNK_EXCLUDES r order by r.NAME"""
            opt = ()
            _rl = []
            _rr = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "process": 1 if row[0] else 0,
                    "name": row[1],
                    "options_st": True if int(row[2][0]) else False,
                    "options_in": True if int(row[2][1]) else False,
                    "owner": row[3],
                    "int_id": int(row[4]),
                }
                if r["process"] == 1:
                    _rl.append(r)
                else:
                    _rr.append(r)
            ret = {"result": True, "ret_val": {"l": _rl, "r": _rr}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def delSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            old_spr = params.get("old_spr")
            new_spr = params.get("new_spr")
            # user = params.get('user')
            if old_spr and new_spr:
                result = None
                result1 = None
                sql = """select r.BARCODE from SPR_BARCODE r where r.ID_SPR = %s"""
                opt = (old_spr,)
                result = self.db.request({"sql": sql, "options": opt})
                if result:
                    for row in result:
                        sql = """insert into SPR_BARCODE (ID_SPR, BARCODE) values (%s, %s) on conflict do nothing"""
                        opt = (new_spr, row[0])
                        self.db.execute({"sql": sql, "options": opt})
                    sql = """delete from SPR_BARCODE where ID_SPR = %s"""
                    opt = (old_spr,)
                    self.db.execute({"sql": sql, "options": opt})
                sql = """update LNK set ID_SPR = %s where ID_SPR = %s"""
                opt = (new_spr, old_spr)
                result = self.db.execute({"sql": sql, "options": opt})
                sql = """delete from SPR where ID_SPR = %s returning ID_SPR"""
                opt = (old_spr,)
                result1 = self.db.execute({"sql": sql, "options": opt})
                if result1:
                    ret = {"result": True, "ret_val": old_spr}
                else:
                    ret = {"result": False, "ret_val": "not deleted"}
            else:
                ret = {"result": False, "ret_val": "no id_sprs"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _parse_dbf(self, f_name: str, f_data: bytes):
        answer = []
        try:
            f_obj = io.BytesIO()
            f_obj.name = f_name
            f_obj.write(f_data)
            f_obj.seek(0)
            for record in DBF(f_obj, encoding="cp866", ignore_missing_memofile=True):
                new_row = []
                row = list(record.values())
                new_row = [
                    10000,
                    row[0],
                    row[1],
                    row[4],
                    0,
                    self._genHash(10000, str(row[1]), str(row[4])),
                    row[2],
                    row[3],
                ]
                answer.append("\t".join([str(i).replace("\r\n", " ").replace("\t", " ") for i in new_row]))
        except Exception:
            raise
        finally:
            f_obj.close()
        return answer

    def _parse_xlsx(self, f_name: str, f_data: bytes):
        answer = []
        try:
            f_obj = io.BytesIO()
            f_obj.name = f_name
            f_obj.write(f_data)
            f_obj.seek(0)
            _wb = load_workbook(f_obj)
            sheet = _wb.worksheets[0]
            for c, row in enumerate(sheet.iter_rows()):
                if c == 0:
                    continue
                tovar = f"{row[1].value} {row[5].value}"
                manuf = f"{row[4].value}, {row[3].value}"
                date_stamp = row[0].value
                try:
                    date_stamp = datetime.datetime.strptime(date_stamp, "%d.%m.%Y").date()
                    date_stamp = date_stamp.strftime("%Y-%m-%d")
                except Exception:
                    traceback.print_exc()

                new_row = [
                    10000,
                    c,
                    tovar,
                    manuf,
                    0,
                    self._genHash(10000, tovar, manuf),
                    row[2].value,
                    date_stamp,
                ]
                answer.append("\t".join([str(i).replace("\r\n", " ").replace("\t", " ") for i in new_row]))
        except Exception:
            traceback.print_exc()
            raise
        finally:
            f_obj.close()
        return answer

    def uploadBrak(self, params=None, x_hash=None):
        if self._check(x_hash):
            # user = params.get("user")
            f_name = params.get("filename")
            data = params.get("data")
            msg1 = f'{"*" * 20} filename: {f_name}'
            self.log(msg1)
            try:
                f_data = data.split(b"\r\n")
                f_data = f_data[4:-6]
                f_data = b"\r\n".join([i for i in f_data])
            except Exception:
                ret = {"result": False, "ret_val": "file recieve error"}
                return json.dumps(ret, ensure_ascii=False)
            with open(f"/ms71/temp/{f_name}", "wb") as f:
                try:
                    f.write(f_data)
                except Exception:
                    f.write(f_data.encode())
            ret_dict = None
            if f_name:
                name = str(int(time.time())) + ".brak"
                try:
                    if ".dbf" in f_name:
                        rows = self._parse_dbf(f_name, f_data)
                    elif ".xlsx" in f_name:
                        rows = self._parse_xlsx(f_name, f_data)
                    else:
                        rows = []
                    if rows:
                        ret_dict = {name: "\n".join(rows)}
                except Exception:
                    self.log(f"upl_br_error: {traceback.format_exc()}")
                    pass
                if ret_dict:
                    send_d = json.dumps(ret_dict, ensure_ascii=False)
                    requests.post(
                        "http://online365.mshub.ru/linker_upl?upload_nolinks",
                        send_d.encode(),
                        headers={"x-api-key": "any header"},
                    )
                    ret = {"result": True, "ret_val": "ok"}
                else:
                    ret = {"result": False, "ret_val": "non accepted format"}
            else:
                ret = {"result": False, "ret_val": "no file"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def barcodeReport(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select barcod, sb.id_spr, s.c_tovar, sb.ch_date
from
    (
    select count(r.id_spr) as qty, r.barcode barcod
    from spr_barcode r
    group by r.barcode
    ) as ww
join spr_barcode sb on barcod=sb.barcode and qty>1
join spr s on sb.id_spr=s.id_spr
order by barcod, sb.id_spr;"""
            headers = [
                {"Штрихкод": "Штрихкод"},
                {"id_spr": "id_spr"},
                {"Название": "Название"},
                {"Дата изменения": "Дата изменения"},
            ]
            r_data = self.db.request({"sql": sql, "options": ()})
            data = []
            out_data = None
            for row in r_data:
                r = {
                    "Штрихкод": row[0],
                    "id_spr": row[1],
                    "Название": row[2],
                    "Дата изменения": row[3],
                }
                data.append(r)
            if data:
                output_data = []
                for item in data:
                    keys = item.keys()
                    re = {}
                    for k in keys:
                        hh = None
                        for h in headers:
                            hh = h.get(k)
                            if hh:
                                break
                        if hh:
                            re[hh] = item.get(k)
                    output_data.append(re)
                out_data = self._genXlsx(output_data)
                if out_data:
                    ret = {
                        "result": True,
                        "ret_val": {"type": "xlsx", "data": out_data},
                    }
                else:
                    ret = {"result": False, "ret_val": "no data"}
            else:
                ret = {"result": False, "ret_val": "error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return ret

    def saveData(self, params=None, x_hash=None):
        methods = {
            "__dt": "getSprSearch",  # spr_dt
            "_files": "getTasks",  # adm-linker-files
            "__dt_a": "getPrcsAll",  # unlinkedall-bar
            "_hran": "getHranAll",  # adm-hran
            "_vendors": "getVendorAll",  # adm-vendors
            "_roles": "getAdmRoles",  # adm_roles
            "_seasons": "getSeasonAll",  # adm-seasons
            "_groups": "getGroupAll",  # adm-groups
            "_codes": "getLinkSuppl",  # adm-linker-codes
            "_dv": "getDvAll",  # adm-dv
            "_country": "getStranaAll",  # adm-country
            "_excldes": "getLinkExcludes",  # adm-linker-excludes
            "__ttl": "getLnkSprs",  # links_form_lnk
            "_users": "getUsersAll",  # adm-users
            "__dt_s": "getPrcsSkip",  # skiped_bar
            "_nds": "getNdsAll",  # adm-nds
            "__dt_as": "getSprSearchAdm",  # adm-spr
            "_issues": "getIssueAll",  # adm-issues
            "__tt": "getSprLnks",  # links_form_spr
            "__dtdb": "getBarsSpr",  # adm-barcodes-b
            "__dtd": "getSprBars",  # adm-barcodes-s
            "__brak": "getBrakSearch",
        }
        if self._check(x_hash):
            user = params.get("user")
            s_params = params.get("s_params")
            f_type = params.get("type", "csv")
            headers = params.get("headers")
            c_filt = s_params.get("c_filt")
            sep = params.get("c_sep")
            search = params.get("search", "энап")
            if not sep:
                sep = params.get("sep")
            if sep == "Табуляция":
                sep = "\t"
            method = methods.get(params.get("table"))
            params = {
                "user": user,
                "search": search,
                "start": 1,
                "count": 100000000,
                "c_filter": c_filt,
            }
            call = getattr(self, method)
            data = json.loads(call(params, x_hash)).get("ret_val")
            if data:
                output_data = []
                if not isinstance(data, list):
                    data = data.get("datas")
                for item in data:
                    keys = item.keys()
                    re = {}
                    for k in keys:
                        hh = None
                        for h in headers:
                            hh = h.get(k)
                            if hh:
                                break
                        if hh:
                            re[hh] = item.get(k)
                    output_data.append(re)
                if f_type == "xlsx":
                    out_data = self._genXlsx(output_data)
                elif f_type == "csv":
                    out_data = self._genCsv(output_data, sep)
                elif f_type == "ods":
                    out_data = self._genOds(output_data)
                if out_data:
                    ret = {
                        "result": True,
                        "ret_val": {"type": f_type, "data": out_data},
                    }
                else:
                    ret = {"result": False, "ret_val": "no data"}
            else:
                ret = {"result": False, "ret_val": "error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return ret

    def processSpr(self, params=None, x_hash=None):
        if self._check(x_hash):
            script_type = params.get("type")
            user = params.get("user")
            if script_type == "spr":
                # command = "ssh ms71 sudo bash /home/plexpert/neutron/modules/start_snapshot.sh"
                # command = "ssh ms71 sudo bash /home/plexpert/neutron/modules/start_test.sh"
                command = "sudo /ms71/saas/spr_copy/start_snapshot.sh"
            elif script_type == "spr_roz":
                # command = "ssh ms71 sudo bash /home/plexpert/neutron/modules/start_snapshot_roz.sh"
                command = "sudo /ms71/saas/spr_copy/start_snapshot_roz.sh"
            else:
                command = ""
            if os.path.exists(f"/ms71/data/linker/{script_type}.pid"):
                command = ""
            else:
                with open(f"/ms71/data/linker/{script_type}.pid", "w") as f_obj:
                    f_obj.write(user)
            if command:
                command = command.split()
                subprocess.Popen(command).wait()
                try:
                    os.remove(f"/ms71/data/linker/{script_type}.pid")
                    with open(f"/ms71/data/linker/{script_type}.lm", "w") as f_obj:
                        f_obj.write(str(int(time.time())))
                        f_obj.write("::" + user)
                except Exception:
                    traceback.print_exc()
                ret = {"result": True, "ret_val": "OK"}
            else:
                ret = {"result": False, "ret_val": "no command"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _genOds(self, data):
        ret = None
        if len(data) > 0:
            ret = ods.Calc("report")
            rows = []
            keys = list(data[0].keys())
            rows.append(keys)
            for item in data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                rows.append(c_string)
            j = 0
            max_widths = {}
            while rows:
                row = rows.pop(0)
                for i in range(len(row)):
                    data = row[i]
                    length = len(str(data))
                    if j == 0:
                        max_widths[i] = length
                    if max_widths[i] < length:
                        max_widths[i] = length
                    if j == 0:
                        ret.set_cell_property("bold", True)
                    else:
                        ret.set_cell_property("bold", False)
                    ret.set_cell_property("fontsize", "8")
                    ret.set_cell_value(i + 1, j + 1, "string", data)
                j += 1
            for i in max_widths:
                ret.set_column_property(i + 1, "width", f"{max_widths[i]*2.4}mm")
            ret_object = io.BytesIO()
            ret.save(ret_object)
            data = ret_object.getvalue()
            ret_object.close()
        return data

    def _genCsv(self, output_data, sep):
        out_data = None
        if len(output_data) > 0:
            out_data = []
            keys = output_data[0].keys()
            out_data.append("\t".join(keys))
            for item in output_data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                out_data.append("\t".join(c_string))
            out_data = "\n".join(out_data)
            out_data = out_data.replace("\t", sep)
        return out_data.encode()

    def _genXlsx(self, data):
        ret_object = io.BytesIO()
        ret_data = None
        properties = {
            "title": "report",
            "category": "Utility",
        }
        x = 6.5
        workbook = xlsx.Workbook(ret_object, {"in_memory": True})
        workbook.set_properties(properties)
        cell_format = {}
        cell_format["header"] = workbook.add_format({"font_size": "8", "bold": True, "align": "center", "bottom": 1})
        cell_format["row"] = workbook.add_format({"font_size": "8", "align": "left"})
        if len(data) > 0:
            rows = []
            keys = list(data[0].keys())
            rows.append(keys)
            for item in data:
                c_string = []
                for k in keys:
                    c_string.append(str(item.get(k)))
                rows.append(c_string)
            worksheet = workbook.add_worksheet("report")
            worksheet.set_print_scale(100)
            j = 0
            max_widths = {}
            while rows:
                row = rows.pop(0)
                for i in range(len(row)):
                    data = row[i]
                    length = len(str(data))
                    if j == 0:
                        max_widths[i] = length
                    if max_widths[i] < length:
                        max_widths[i] = length
                worksheet.write_row(j, 0, row, cell_format["header" if j == 0 else "row"])
                j += 1
            for i in max_widths:
                worksheet.set_column(i, i, max_widths[i] * (x if max_widths[i] > 10 else 9))
            worksheet.set_paper(9)  # размер А4
            worksheet.set_portrait()  # портретная ориентация
            worksheet.set_margins(left=1, right=0.5, top=0.5, bottom=0.5)
            workbook.close()
            ret_data = ret_object.getvalue()
            ret_object.close()
        return ret_data

    def _make_sql(self, params):
        sql = params.get("sql")
        opt = params.get("opt")
        res = self.db.execute({"sql": sql, "options": opt})
        # res = self.db.request({"sql": sql, "options": opt})
        return res

    def _form_exclude(self, search_re):
        exclude = []
        for _ in range(search_re.count("!")):
            ns = search_re.find("!")
            ne = search_re.find(" ", ns)
            te = search_re[ns + 1 : ne if ne > 0 else None]
            exclude.append(te)
            search_re = search_re.replace("!" + te, "")
        return exclude, search_re

    def _check(self, x_hash):
        # проверка валидности ключа
        ret = False
        if x_hash:
            f_name = os.path.join(self.p_path, x_hash)
            if os.path.exists(f_name):
                ret = True
        return ret

    def _insGr(self, params, result, new=False):
        prescr = params.get("id_prescr")
        mandat = params.get("mandat")
        id_sezon = params.get("id_sezon")
        id_usloviya = params.get("id_usloviya")
        id_group = params.get("id_group")
        id_nds = params.get("id_nds")
        c_tgroup = params.get("c_tgroup")
        c_tgroup = c_tgroup.split("; ")
        sql = """insert into GROUPS (CD_CODE, CD_GROUP) values (%s, %s)"""
        opt = []
        for i in range(len(c_tgroup)):
            c_tgroup[i] = c_tgroup[i].strip()
            if len(c_tgroup[i]) < 1:
                c_tgroup.pop(i)
        stri = ", ".join(["'" + q + "'" for q in c_tgroup]) if len(c_tgroup) > 0 else "''"
        sq = "SELECT r.CD_GROUP FROM CLASSIFIER r WHERE r.IDX_GROUP = 7 AND r.NM_GROUP in (%s)" % stri
        tt = self.db.execute({"sql": sq, "options": ()})
        for id_tgroup in tt:
            opt.append((result, id_tgroup[0]))
            if new:
                ########## товарная группа
                self._updValue(id_tgroup[0])
        if id_group:
            opt.append((result, id_group))
            if new:
                ########## группа товара (медикаменты, инструменты, etc.)
                self._updValue(id_group)
        if id_nds:
            opt.append((result, id_nds))
            if new:
                # НДС
                self._updValue(id_nds)
        if id_usloviya:
            opt.append((result, id_usloviya))
            if new:
                # условия хранения
                self._updValue(id_usloviya)
        if mandat:
            opt.append((result, "ZakMedCtg.15"))
        if prescr:
            if prescr in ["ZakMedCtg.16", "a6c4ccf913304a7bb5ed04f02c2c4394"]:
                opt.append((result, prescr))
            else:
                self.db.execute(
                    {
                        "sql": f"""delete
from GROUPS 
where CD_CODE = {result}
and CD_GROUP in (select cd_group from CLASSIFIER where idx_group = 5"""
                    }
                )
        if id_sezon:
            opt.append((result, id_sezon))
            if new:
                # сезон
                self._updValue(id_sezon)
        if len(opt) > 0:
            self.db.executemany({"sql": sql, "options": opt})

    def _updValue(self, field_name, table_name="classifier", column_name="cd_group"):
        sql = f"""update {table_name} set gr_count = gr_count + 1 where {column_name} = '{field_name}' returning gr_count;"""
        self.db.execute({"sql": sql, "options": ()})

    def _setUnwork(self, user):
        sql = """UPDATE PRC SET IN_WORK = -1
where IN_WORK = (SELECT u.ID FROM USERS u WHERE u."USER" = %s)"""
        opt = (user,)
        self.db.execute({"sql": sql, "options": opt})
        return 1

    def _genHash(self, id_vnd, tovar, zavod):
        s = "".join((tovar.replace(" /ЖНВЛС/", ""), zavod)).upper().replace(",", ".").split()
        fg_ochki = "ОЧКИ" in s
        n = []
        s1 = []
        for x in "".join(s):
            c = ord(x)
            if c > 57:
                s1.append(x)
            elif c > 47:
                n.append(x)
            elif fg_ochki and c in [43, 45]:
                s1.append(x)
        s1.sort()
        n.extend(s1)
        s = "".join(n)
        sh_prc = hashlib.md5()
        sh_prc.update(str(id_vnd).encode())
        sh_prc.update(s.encode("1251", "ignore"))
        return sh_prc.hexdigest()

    def _check_rus(self, orig_string):
        rus = False
        for i in orig_string:
            if ord(i) >= 1040 and ord(i) <= 1071:
                rus = True
        return rus

    def _lang_trans(self, orig_string):
        r2e = {
            "А": "A",
            "В": "B",
            "Е": "E",
            "К": "K",
            "М": "M",
            "Н": "H",
            "О": "O",
            "Р": "P",
            "С": "C",
            "Т": "T",
            "У": "Y",
            "Х": "X",
        }
        e2r = {
            "A": "А",
            "B": "В",
            "C": "С",
            "E": "Е",
            "H": "Н",
            "K": "К",
            "M": "М",
            "O": "О",
            "P": "Р",
            "T": "Т",
            "X": "Х",
            "Y": "У",
        }
        new_list = []
        orig_list = list(orig_string)
        for i in orig_list:
            s = (r2e if self._check_rus(orig_string) else e2r).get(i, i)
            new_list.append(s)
        return "".join(new_list)

    def _xls2csv(self, excel_file):
        workbook = xlrd.open_workbook(excel_file)
        all_worksheets = workbook.sheet_names()
        series = []
        for worksheet_name in all_worksheets:
            worksheet = workbook.sheet_by_name(worksheet_name)
            for rownum in range(worksheet.nrows):
                if rownum == 0:
                    continue
                row = worksheet.row_values(rownum)
                s = row[3]
                if not isinstance(s, str):
                    try:
                        s = str(int(row[3]))
                    except Exception:
                        pass
                ser = {
                    "file_series": s,
                    "file_number": str(row[4]),
                    "file_title": str(row[6]).replace("\n", ""),
                }
                series.append(ser)
        return series

    def _genClassId(self):
        repeat = True
        genId = ""
        sql = """SELECT
CASE
WHEN not EXISTS(select c.cd_group from classifier c where c.cd_group = %s) THEN 0
ELSE 1
END ;"""
        while repeat:
            genId = uuid.uuid4().hex
            opt = (genId,)
            result = self.db.request({"sql": sql, "options": opt})
            if result[0][0] == 0:
                repeat = False
            # repeat = False
        return genId

    def checkBrakXls(self, params, x_hash):
        if self._check(x_hash):
            filename = params.get("filename")
            data = params.get("data")
            f_data = data.split(b"\r\n")
            f_data = f_data[4:-6]
            f_data = b"\r\n".join([i for i in f_data])
            file_name = os.path.join("/ms71/temp", filename)
            with open(file_name, "wb") as f:
                try:
                    f.write(f_data)
                except Exception:
                    f.write(f_data.encode())
            sql_template = """select distinct seriya, title_doc, 'eng'
from brak_mail
where seriya = '%s' and deleted = 0--eng
union all
select distinct seriya, title_doc, 'rus'
from brak_mail
where seriya = '%s' and deleted = 0--rus
"""
            sql_t2 = """select distinct seriya, title_doc, 'eng'
from brak_mail
where seriya = '%s'"""
            sqls = []
            series = self._xls2csv(file_name)
            for row in series:
                s = row.get("file_series")
                if self._check_rus(s):
                    s_rus = s
                    s_eng = self._lang_trans(s)
                else:
                    s_eng = s
                    s_rus = self._lang_trans(s)
                if s_eng == s_rus:
                    sql = sql_t2 % s_eng
                else:
                    sql = sql_template % (s_eng, s_rus)
                sqls.append(sql)
            results = []
            while sqls:
                sqls_re = []
                for i in range(9):
                    try:
                        sqls_re.append({"sql": sqls.pop(0), "opt": ()})
                    except Exception:
                        break
                pool = ThreadPool(len(sqls_re))
                # results.extend(pool.map(self._make_sql_1, sqls_re))
                results.extend(pool.map(self._make_sql, sqls_re))
                pool.close()
                pool.join()
            for i, s in enumerate(series):
                row = results[i]
                if row:
                    qw = []
                    if len(row) > 1:
                        for j in row:
                            qw.append(j[1])
                    else:
                        qw.append(row[0][1])
                    qw = ", ".join(qw)

                    if s.get("file_number") in qw:
                        s["result"] = True
                        s["letter_match"] = True
                    else:
                        s["result"] = False
                        s["letter_match"] = False
                    s["title"] = qw
                    s["base_lang"] = row[0][2]
                else:
                    s["result"] = False
                    s["title"] = ""
                s["file_rus"] = "rus" if self._check_rus(s.get("file_series")) else "eng"
            try:
                os.remove(file_name)
            except Exception:
                pass

            ret = {"result": True, "ret_val": series}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def updatePrcNewUsers(self, params=None, x_hash=None):
        if self._check(x_hash):
            group = params.get("group")
            rows = params.get("rows")
            if group and rows:
                i = len(rows)
                sql = f"""update prc
set id_org = coalesce((select ug.id_group as q
             from users_groups ug where c_group = '{group}'), -1)
where id_vnd in ({', '.join(['%s' for q in range(i)])})"""
                opt = [int(k["id_vnd"]) for k in rows]
                result = self.db.execute({"sql": sql, "options": opt})
                if result:
                    ret = {"result": True, "ret_val": True}
                else:
                    ret = {"result": False, "ret_val": "sql error"}
            else:
                ret = {"result": False, "ret_val": "no data"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setVndsUsers(self, params=None, x_hash=None):
        if self._check(x_hash):
            group = params.get("group")
            rows = params.get("rows")
            if group and rows:
                i = len(rows)
                sql = f"""update vnd
set users_group = (select ug.id_group from users_groups ug where c_group = '{group}')
where id_vnd in ({', '.join(['%s' for q in range(i)])})
returning users_group"""
                opt = [int(k["id_vnd"]) for k in rows]
                result = self.db.execute({"sql": sql, "options": opt})
                if result:
                    ret = {"result": True, "ret_val": True}
                else:
                    ret = {"result": False, "ret_val": "sql error"}
            else:
                ret = {"result": False, "ret_val": "no data"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getVndsUsers(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select v.id_vnd, v.c_vnd,
coalesce(v.website, ''),
v.users_group,
coalesce(u.c_group, 'не назначено'),
coalesce(u.c_description, 'нет описания')
from vnd v
left join users_groups u on (v.users_group = u.id_group)
order by id_vnd;
            """
            _return = []
            result = self.db.request({"sql": sql, "options": ()})
            for row in result:
                r = {
                    "id_vnd": row[0],
                    "c_vnd": row[1],
                    "website": row[2],
                    "users_group": row[3],
                    "c_group": row[4],
                    "c_description": row[5],
                }
                _return.append(r)

            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUsersGroups(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = """select c_group
from users_groups
order by c_group"""
            _return = ["не назначено"]
            result = self.db.request({"sql": sql, "options": ()})
            for row in result:
                _return.append(row[0])

            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


"""
CREATE TABLE public.nom_codes
(
    code text NOT NULL,
    nom_name text COLLATE pg_catalog."default" NOT NULL,
    spr_name text COLLATE pg_catalog."default",
    gr_count integer DEFAULT 0,
    CONSTRAINT nom_codes_pkey PRIMARY KEY (code, nom_name)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.nom_codes
    OWNER to postgres;

ALTER TABLE public.spr
    ADD COLUMN id_521 text;


insert into nom_codes (code, nom_name, spr_name)
values
('2400001323807', 'маска для защиты дыхательных путей, многоразового использования', 'Маска для защиты дыхательных путей, одноразового(многоразового) использования'),
('2400003675805', 'маска для защиты дыхательных путей, одноразового использования', 'Маска для защиты дыхательных путей, одноразового(многоразового) использования'),
('2400001807703', 'респиратор общего применения', 'Респиратор общего применения'),
('2400001818303', 'респиратор хирургический', 'Респиратор хирургический'),
('2400002186203', 'респиратор хирургический антибактериальный', 'Респиратор хирургический'),
('2400001368105', 'средство назальное для защиты от загрязненного воздуха, местного действия', 'Средство назальное для защиты от загрязненного воздуха, местного действия'),
('2400001225408', 'перчатки смотровые (процедурные) из латекса гевеи, неопудренные, нестерильные', 'Перчатки смотровые (процедурные)'),
('2400001225606', 'перчатки смотровые (процедурные) из латекса гевеи, опудренные', 'Перчатки смотровые (процедурные)'),
('2400001226108', 'перчатки смотровые (процедурные) из латекса гевеи, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400001393503', 'перчатки смотровые (процедурные) из полихлоропрена, неопудренные', 'Перчатки смотровые (процедурные)'),
('2400001858309', 'перчатки смотровые (процедурные) нитриловые, неопудренные, нестерильные', 'Перчатки смотровые (процедурные)'),
('2400001858507', 'перчатки смотровые (процедурные) нитриловые, опудренные', 'Перчатки смотровые (процедурные)'),
('2400002052805', 'перчатки смотровые (процедурные) виниловые, неопудренные', 'Перчатки смотровые (процедурные)'),
('2400002052904', 'перчатки смотровые (процедурные) виниловые, опудренные', 'Перчатки смотровые (процедурные)'),
('2400002984502', 'перчатки смотровые (процедурные) из гваюлового латекса, неопудренные', 'Перчатки смотровые (процедурные)'),
('2400003117107', 'перчатки смотровые (процедурные) из этиленвинилацетата, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003117206', 'перчатки смотровые (процедурные) из этиленвинилацетата, неопудренные, нестерильные', 'Перчатки смотровые (процедурные)'),
('2400003207907', 'перчатки смотровые (процедурные) нитриловые, неопудренные, антибактериальные', 'Перчатки смотровые (процедурные)'),
('2400003215308', 'перчатки смотровые (процедурные) полиизопреновые, неопудренные', 'Перчатки смотровые (процедурные)'),
('2400003297700', 'перчатки смотровые (процедурные) нитриловые, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003356704', 'перчатки смотровые (процедурные) виниловые, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003356803', 'перчатки смотровые (процедурные) виниловые, опудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003433108', 'перчатки смотровые (процедурные) из латекса гевеи, опудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003492303', 'перчатки смотровые (процедурные) полиизопреновые, опудренные', 'Перчатки смотровые (процедурные)'),
('2400003495700', 'перчатки смотровые (процедурные) из полихлоропрена, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003495809', 'перчатки смотровые (процедурные) из полихлоропрена, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003495908', 'перчатки смотровые (процедурные) нитриловые, опудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003496004', 'перчатки смотровые (процедурные) полиизопреновые, неопудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400003496103', 'перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные', 'Перчатки смотровые (процедурные)'),
('2400001226306', 'перчатки хирургические из латекса гевеи, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001226405', 'перчатки хирургические из латекса гевеи, опудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001393107', 'перчатки хирургические из полихлоропрена, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001393602', 'перчатки смотровые (процедурные) из полихлоропрена, опудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001565306', 'перчатки хирургические из блоксополимера стирола, неопудренные, антибактериальные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001857203', 'перчатки хирургические нитриловые, опудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400001857005', 'перчатки хирургические нитриловые, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400002015909', 'перчатки хирургические полиизопреновые, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400002016005', 'перчатки хирургические полиизопреновые, неопудренные, антибактериальные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400002016104', 'перчатки хирургические полиизопреновые, опудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003161209', 'перчатки хирургические из блоксополимера стирола, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003227806', 'перчатки хирургические полимерно-композитные, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003237409', 'перчатки хирургические полимерно-композитные, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003263408', 'перчатки хирургические из латекса гевеи, неопудренные, антибактериальные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003356902', 'перчатки хирургические из гваюлового латекса, неопудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400003356902', 'перчатки хирургические из гваюлового латекса, опудренные', 'Перчатки смотровые (процедурные) полиизопреновые, опудренные, стерильные'),
('2400002886806', 'набор гигиенической одежды для посетителей', 'Набор гигиенической одежды для посетителей'),
('2400002886707', 'комбинезон гигиенический для посетителей', 'Комбинезон гигиенический для посетителей')
"""
