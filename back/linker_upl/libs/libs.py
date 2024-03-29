# coding: utf-8

import configparser
import errno
import fcntl
import glob
import hashlib
import json
import os
import re
import shutil
import socket
import ssl
import subprocess
import sys
import threading
import time
import traceback
import urllib.request
from urllib.parse import unquote

import libs.connect_pool as connect_pool
from libs.lockfile import LockWait

import requests


class API:
    """
    API class for http post access
    x_hash - API key
    """

    def __init__(
        self,
        Lock,
        log,
        w_path="/ms71/data/linker_upl",
        p_path="/ms71/data/linker_upl/restricted",
        skip_path="/ms71/data/linker_upl/skipped",
    ):
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        self.skip_path = skip_path
        self.inw_path = os.path.join(self.path, "in_work")
        if not os.path.exists(self.skip_path):
            os.makedirs(self.skip_path, mode=0o777)
        if not os.path.exists(self.path):
            os.makedirs(self.path, mode=0o777)
        if not os.path.exists(self.p_path):
            os.makedirs(self.p_path, mode=0o777)
        if not os.path.exists(self.inw_path):
            os.makedirs(self.inw_path, mode=0o777)
        self.lock = Lock
        self.exec = sys.executable
        self.log = log
        self.nauth = {}
        config = configparser.ConfigParser()
        config.read("/ms71/saas/linker/conf.ini", encoding="UTF-8")
        self.nauth = config["nauth"]
        pg = "/ms71/saas/linker_upl/spr.postgres"
        print("=" * 20, flush=True)
        print(pg, flush=True)
        print("=" * 20, flush=True)
        if not pg:
            self.pg_connect_params = {
                "dbname": "spr",
                "user": "postgres",
                "host": "127.0.0.1",
                "port": 5432,
            }
        else:
            if os.path.exists(pg):
                conn = None
                with open(pg, "r") as _f:
                    conn = _f.readlines()
                if conn:
                    self.pg_connect_params = {}
                    for x in conn:
                        i = x.find("=")
                        if i > -1:
                            k, x = x[:i].strip(), x[i + 1 :].strip()
                        else:
                            k = None
                        if k:
                            self.pg_connect_params[unquote(k)] = unquote(x)
                        else:
                            pass
            else:
                self.pg_connect_params = {
                    "dbname": "spr",
                    "user": "postgres",
                    "host": "127.0.0.1",
                    "port": 5432,
                }
        self._pg = True
        self.production = True
        print("-------POSTGRESQL--------")
        self.log(str(self.pg_connect_params), kind="Connection")
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)
        self.connection = connect_pool.ConectPool(
            connection_params=self.pg_connect_params
        )  # пул коннектов

    def _check(self, x_hash):
        return True

    def _get_checksum(self, data):
        hash_md5 = hashlib.md5()
        hash_md5.update(data)
        return hash_md5.hexdigest()

    def upload_nolinks(self, params, x_hash):
        # загрузка данных по накладным из json
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            # source = 2
            callback = None
            data = params
            # ключ словаря - идентификатор файла (имя), значение - список строк товаров для сведения в фомате tab separated, все как в файле:
            # sh_prc, код поставщика, код товара у поставщика, название товара, изгтовитель, код организации, штрихкод
            name, value = data.popitem()
            if "agent" in name:
                source = 3  # Михалыч
            elif "edocs" in name:
                source = 4  # Гриша
            elif len(name) > 35 or "sklad" in name:
                source = 2  # Склад
            else:
                source = 1  # PLE
            """
            ниже заглушка, чтобы не принимать файлы из PLExpert

            if source == 1:
                ret = {"result": False, "ret_val": "temporary access denied"}
                return json.dumps(ret, ensure_ascii=False)
            """
            self.log("UPLOAD| source: %s" % source)
            self.log("UPLOAD| " + "*" * 50)
            if len(value.encode()) < 500:
                self.log("UPLOAD| %s" % value)
            else:
                self.log("UPLOAD| %s" % "слишком много значений для вывода")
            con = self.connection.connect()
            cur = con.cursor()

            # con, cur = self._connect()

            h_name = self._get_checksum(
                (str(name) + str(time.time())).encode()
            )
            c_sum = self._get_checksum(value.encode())
            self.log(
                "UPLOAD| file: %s, h_name: %s, c_summ: %s"
                % (name.encode(), h_name, c_sum)
            )
            if source == 1:
                sql = f"""select c_sum from PRC_TASKS where uin='{h_name}' and source = 1"""
                cur.execute(sql)
                ret = cur.fetchone()
                self.log("UPLOAD| ret checksumm -> %s" % ret)
                if ret:
                    old_sum = ret[0]
                    if c_sum == old_sum:
                        self.log("UPLOAD| skip file %s" % name)
                        ret = {"result": True, "ret_val": "accepted"}
                        con.close()
                        return json.dumps(ret, ensure_ascii=False)
            # sql = f"insert into PRC_TASKS (uin, source, callback, dt) values ('{h_name}', {int(source)}, '{callback}', current_timestamp)"
            sql = f"""insert into PRC_TASKS (uin, source, callback, dt, c_sum) values ('{h_name}', {int(source)}, '{callback or ''}', current_timestamp, '{c_sum}')
ON CONFLICT (UIN) DO UPDATE
    SET (uin, source, callback, dt, c_sum) = ('{h_name}', {int(source)}, '{callback or ''}', current_timestamp, '{c_sum}');"""
            try:
                cur.execute(sql)
                con.commit()
            except Exception:
                self.log("UPLOAD| Can't insert task", kind="SQLError")
                self.log("UPLOAD| ERROR Text-> %s" % traceback.format_exc())
            finally:
                con.close()
            try:
                id_vnd = name[5:10]
            except Exception:
                id_vnd = ""
            if id_vnd not in ["45835", "51066"]:
                id_vnd = ""

            f_name = os.path.join(self.path, f"{h_name}.{id_vnd}.{source}")
            with open(f_name, "wb") as f_obj:
                f_obj.write(value.encode())
            ret = {"result": True, "ret_val": "accepted"}
            self.log("UPLOAD| " + "*" * 50)
        return json.dumps(ret, ensure_ascii=False)

    def upload_file(
        self, filename, data, source=0, callback=None, x_hash=None
    ):
        if source == "linker":
            f_data = data.split(b"\r\n")
            # f_data = f_data[4:-2]
            f_data = f_data[4]
            # f_data = b'\r\n'.join([i.strip() for i in f_data])
            source = 2
        else:
            f_data = data
        try:
            f_data = f_data.decode()
        except Exception:
            pass
        # print(filename, len(f_data), type(f_data))
        params = {filename: f_data}
        # ret = {"result": True, "ret_val": "accepted"}
        ret = self.upload_nolinks(params, x_hash)
        return json.dumps(ret, ensure_ascii=False)

    def _calculate_checksum(self, ean12):
        s1 = 0
        s2 = 0
        for i, s in enumerate(ean12):
            if divmod(13 - i, 2)[1]:
                s1 += int(s)
            else:
                s2 += int(s)
            c1 = s2 * 3 + s1
            c2 = c1 // 10
            if c1 / 10 - c2:
                c2 += 1
        return "%s" % (c2 * 10 - c1)

    def _check_barcode(self, barcode):
        try:
            barcode = barcode.split(",")[-1]
            ean = str(barcode).strip()
            ean = ean[:12]
            if len(ean) < 12:
                # self.log(f"BARCODE_CH error: ean: {str(barcode)}")
                return None
            if not ean.isdigit():
                return None
            return "{0}{1}".format(ean, self._calculate_checksum(ean))
        except Exception:
            return None

    def upload_to_db(
        self, db, dbc, id_vnd, path, count_insert, count_all, source=1
    ):
        uin = os.path.basename(path).split(".")[0]
        if uin.split(".")[0] != uin:
            uin = None
        _re = re.compile("\(..\...\)")  # noqa
        rows = []
        with open(path, "rb") as f:
            rows = f.read()
        rows = rows.decode("utf8").splitlines()
        self.log(f"UPLOAD2DB - Всего в файле: {len(rows)}")

        count_all += len(rows)
        ret = []
        uniq_sh_prc = set()
        if rows:
            ins_params = []
            for row in rows:
                fgCont = False
                kod, tovar, zavod, idorg, barcode, sh_brak, series, dt_brak = (
                    "",
                    "",
                    "",
                    "0",
                    None,
                    "",
                    "",
                    "",
                )
                try:
                    (
                        _,
                        kod,
                        tovar,
                        zavod,
                        idorg,
                        sh_brak,
                        series,
                        dt_brak,
                    ) = row.split("\t")[0:8]
                except Exception:
                    try:
                        _, kod, tovar, zavod, idorg, barcode = row.split("\t")[
                            0:6
                        ]
                        barcode = self._check_barcode(barcode)
                    except Exception:
                        try:
                            _, kod, tovar, zavod, idorg = row.split("\t")[0:5]
                        except Exception:
                            try:
                                _, kod, tovar, zavod = row.split("\t")[0:4]
                            except Exception:
                                self.log(f"UPLOAD2DB - ROW ERROR: {str(row)}")
                                raise ValueError
                try:
                    idorg = int(idorg.strip())
                except Exception:
                    idorg = 0
                try:
                    cena = 0
                    if id_vnd == 20171:
                        fgCont = kod.find("/") > -1
                    tovar = tovar.replace(" /ЖНВЛС/", "")
                except Exception:
                    fgCont = True
                try:
                    z_ind = zavod.lower().find("<маркетинг>")
                    if z_ind != -1:
                        zavod = zavod[z_ind + 11 :].strip()
                except Exception:
                    pass
                if fgCont:
                    if id_vnd == 40277:
                        self.log("fgCont")
                        self.log(tovar)
                        self.log(zavod)
                    continue
                if not id_vnd == 40277 and _re.search(tovar):
                    self.log("rsearch")
                    self.log(id_vnd)
                    self.log(tovar)
                    self.log(zavod)
                    continue
                try:
                    cena = int(float(cena) * 100)
                except Exception:
                    cena = 0
                # Формируем хеш
                if id_vnd in [28177, 28132, 28176, 28178]:  # пульс
                    _id_vnd = 28162
                elif id_vnd in [20577, 20576, 20543, 20552]:  # катрен
                    _id_vnd = 20557
                elif id_vnd in [48347, 48352]:  # Алиди
                    _id_vnd = 48347
                elif id_vnd in [48736]:  # Акцент-мед
                    _id_vnd = 48761
                elif id_vnd in [20662]:
                    _id_vnd = 20677
                elif id_vnd in [20477]:
                    _id_vnd = 20471
                elif id_vnd in [20177, 20153, 20176, 20129, 20123]:  # сиа
                    _id_vnd = 20171
                elif id_vnd in [45835, 51066, 51191]:
                    _id_vnd = 44735
                elif id_vnd in [
                    20277,
                    20276,
                    20229,
                    20269,
                    20237,
                    20216,
                ]:  # протек
                    _id_vnd = 20277
                elif id_vnd in [20378]:
                    _id_vnd = 20377
                elif id_vnd in [30144]:
                    _id_vnd = 30178
                # по указанию Краснова 06.06.2022
                # elif id_vnd in [22078]:  # профитмед78
                #     _id_vnd = 22077
                elif id_vnd in [40267, 40277, 40278]:
                    _id_vnd = 40277
                elif id_vnd in [19973, 19972, 19971]:  # М-апретка
                    _id_vnd = 19987
                elif id_vnd in [34157, 34168]:  # Надежда-Ф
                    _id_vnd = 34157
                else:
                    _id_vnd = id_vnd
                # Добавление забракованных серий
                if sh_brak and series:
                    if len(series) > 32:
                        series = series[:32]
                    self.log(f"UPLOAD2DB - забраковка: {sh_brak}, {series}")
                    oopt = (sh_brak, series, dt_brak)
                    #  sql = """INSERT INTO BRAK (SH_PRC, SERIES, DT) VALUES (%s,%s,%s)
                    # ON CONFLICT (SH_PRC, SERIES) DO UPDATE
                    # SET (SH_PRC, SERIES, DT) = (%s,%s,%s);"""
                    # oopt = oopt + oopt

                    sql = """INSERT INTO BRAK (SH_PRC, SERIES, DT) VALUES (%s,%s,%s)
ON CONFLICT (SH_PRC, SERIES) DO nothing;"""

                    dbc.execute(sql, oopt)
                    if callable(db.commit):
                        db.commit()
                try:
                    sh_prc = self._genHash(_id_vnd, tovar, zavod)
                except Exception:
                    self.log("hash_gen_error")
                    self.log(sh_prc)
                    self.log(tovar)
                    self.log(zavod)
                    continue
                uniq_sh_prc.add(sh_prc)
                if _id_vnd == 40277:
                    self.log(sh_prc)
                    self.log(tovar)
                    self.log(zavod)
                # source = source#1 - прайслистэксперт, 2 - склад
                if id_vnd in [51201, "51201"]:
                    kod = kod.replace("-", "")
                instr = (
                    id_vnd,
                    kod,
                    cena,
                    sh_prc,
                    tovar.replace("'", "''"),
                    zavod.replace("'", "''"),
                    idorg,
                    source,
                    barcode,
                    uin,
                )
                if len(tovar) > 255:
                    continue
                inss = instr + instr
                ins_params.append(inss)

            # создали массив с данными на вставку

            sql = """INSERT INTO A_TEMP_PRC (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, source, barcode, uin)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (SH_PRC) DO UPDATE
    SET (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, source, barcode, uin) = (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
"""
            if len(ins_params) == 0:
                # нет ничего на вставку - выходим
                return count_insert, count_all

            dbc.executemany(sql, ins_params)
            if callable(db.commit):
                db.commit()
            self.log("UPLOAD2DB - inserted")
            for row in self._getGen(
                dbc,
                "SELECT sh_prc, barcode FROM A_TEMP_PRC WHERE barcode is NOT NULL",
            ):
                # заводим новые ШК
                dbc.execute(
                    f"""SELECT l.ID_SPR FROM LNK l WHERE l.SH_PRC = {'?' if not self._pg else '%s'}""",
                    (row[0],),
                )
                ret = dbc.fetchone()
                if ret:
                    dbc.execute(
                        f"""UPDATE spr set barcode = {'?' if not self._pg else '%s'} where id_spr = {'?' if not self._pg else '%s'} and barcode is null""",
                        (row[1], ret[0]),
                    )
                    oopt = (row[1], ret[0])
                    sql = """INSERT INTO spr_barcode (barcode, id_spr) values (%s, %s)
ON CONFLICT (ID_SPR, BARCODE) DO UPDATE
SET (barcode, id_spr) = (%s, %s);"""
                    oopt = oopt + oopt
                    dbc.execute(sql, oopt)
                # завели новые ШК
            self.log("UPLOAD2DB - updated barcodes")
            dbc.execute(
                """delete from A_TEMP_PRC
using lnk
where  lnk.sh_prc = A_TEMP_PRC.sh_prc"""
            )
            self.log("UPLOAD2DB - sames with lnk deleted")

            dbc.execute(
                """UPDATE PRC SET C_INDEX = C_INDEX + 1
FROM (SELECT SH_PRC FROM A_TEMP_PRC) as r
WHERE r.SH_PRC = PRC.SH_PRC"""
            )
            self.log("UPLOAD2DB - doubles in prc updated")

            # TODO: здесь нужно обработать слова исключения
            dbc.execute(
                """DELETE FROM A_TEMP_PRC
USING PRC
WHERE A_TEMP_PRC.SH_PRC = PRC.SH_PRC"""
            )
            if callable(db.commit):
                db.commit()
            self.log("UPLOAD2DB пропускаем по признаку")
            con_ins = f"and uin = '{uin}'"
            excl_sql = """SELECT r.NAME, r.OPTIONS FROM LNK_EXCLUDES r where r.PROCESS = 1"""
            dbc.execute(excl_sql)
            ret = dbc.fetchall()
            ap = []
            for row in ret:
                if row[1][1] == "1":
                    st = f"""upper(c_tovar) like upper('%{row[0]}%')"""
                else:
                    st = f"""upper(c_tovar) like upper('{row[0]}%')"""
                ap.append(st)
            ap = " \nor ".join(ap)

            sql = """INSERT INTO prc
(ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source, uin, n_fg)
SELECT
r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, 0, -1, r.source, r.uin, 1
FROM A_TEMP_PRC r
WHERE 1=1
    and r.id_vnd != 45835
    and r.id_vnd != 51066
    and r.id_org != 40035
    and (r.source != 2 or r.source is null)
    %s
    and (%s)
""" % (
                con_ins,
                ap,
            )

            dbc.execute(sql)
            if callable(db.commit):
                db.commit()
            self.log("UPLOAD2DB - skipped by excludes")

            dbc.execute(
                """DELETE FROM A_TEMP_PRC
USING PRC
WHERE A_TEMP_PRC.SH_PRC = PRC.SH_PRC"""
            )
            if callable(db.commit):
                db.commit()
            self.log("UPLOAD2DB - doubles with prc deleted")

            dbc.execute(
                """INSERT INTO lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
select r.SH_PRC, s.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, CURRENT_TIMESTAMP, 'barcode'
FROM A_TEMP_PRC r JOIN SPR_BARCODE s on s.BARCODE = r.BARCODE
on conflict do nothing"""
            )
            dbc.execute(
                """DELETE FROM A_TEMP_PRC
USING SPR_BARCODE
WHERE SPR_BARCODE.BARCODE = A_TEMP_PRC.BARCODE"""
            )
            self.log("UPLOAD2DB - linked by barcode")
            dbc.execute(
                """delete from A_TEMP_PRC
using lnk
where  lnk.sh_prc = A_TEMP_PRC.sh_prc"""
            )
            self.log("UPLOAD2DB - sames with lnk deleted after barcodes")

            for row in self._getGen(
                dbc,
                """SELECT r.sh_prc FROM A_TEMP_PRC r
JOIN (select rr.BARCODE bc, count(rr.BARCODE) cbc FROM A_TEMP_PRC rr
JOIN SPR_BARCODE s on s.BARCODE = rr.BARCODE
where rr.BARCODE is NOT NULL
GROUP by rr.BARCODE HAVING COUNT(rr.BARCODE) > 1) as ttt1 on bc = r.BARCODE""",
            ):
                dbc.execute(
                    f"""INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source, uin)
SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source, r.uin
FROM A_TEMP_PRC r where r.SH_PRC = {'?' if not self._pg else '%s'}""",
                    (row[0],),
                )
                dbc.execute(
                    f"""DELETE FROM A_TEMP_PRC WHERE SH_PRC = {'?' if not self._pg else '%s'}""",
                    (row[0],),
                )

            dbc.execute("""SELECT COUNT(*) FROM A_TEMP_PRC""")
            count_i = dbc.fetchone()[0]
            dbc.execute(
                """INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source, uin)
SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source, r.uin
FROM A_TEMP_PRC r """
            )
            dbc.execute("""TRUNCATE A_TEMP_PRC""")
            if callable(db.commit):
                db.commit()
            count_insert += count_i
        return count_insert, count_all, len(uniq_sh_prc)

    def _getGen(self, dbc, sql):
        dbc.execute(sql)
        ret = dbc.fetchall()
        self.log(f"SQL_GEN: {sql}, \n count: {len(ret)}")
        for row in ret:
            yield row

    def _genHash(self, id_vnd, tovar, zavod):
        s = (
            "".join((tovar.replace(" /ЖНВЛС/", ""), zavod))
            .upper()
            .replace(",", ".")
            .split()
        )
        fg_ochki = ("ОЧКИ" in s) or ("ЛИНЗЫ" in s)
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

    def prc_sync_lnk(self, db, dbc, uin=None):

        self.log("PRCSYNC удаляем сущетсвующие линки")
        dbc.execute(
            """delete from prc
using lnk
where  lnk.sh_prc = prc.sh_prc"""
        )
        if callable(db.commit):
            db.commit()
        self.log("PRCSYNC ---удалили сущетсвующие линки")
        if uin:
            con_ins = f"and uin = '{uin}'"
        else:
            con_ins = "and dt > CURRENT_DATE - 7"
        sq = """SELECT r.NAME, r.OPTIONS FROM LNK_EXCLUDES r where r.PROCESS = 1"""
        dbc.execute(sq)
        ret = dbc.fetchall()
        ap = []
        for row in ret:
            if row[1][1] == "1":
                st = f"""upper(c_tovar) like upper('%{row[0]}%')"""
            else:
                st = f"""upper(c_tovar) like upper('{row[0]}%')"""
            ap.append(st)
        ap = " \nor ".join(ap)
        sql = """update PRC set n_fg=1, id_org=0
where n_fg!=1
    and id_vnd != 45835
    and id_vnd != 51066
    and id_org != 40035
    and (source != 2 or source is null)
    %s
    and (%s)""" % (
            con_ins,
            ap,
        )
        self.log("PRCSYNC пропускаем по признаку")
        dbc.execute(sql)
        if callable(db.commit):
            db.commit()
        self.log("PRCSYNC ---Пропустили по признаку")
        self.log("PRCSYNC Сводим по кодам")
        sql = """insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
select DISTINCT p.sh_prc, l.id_spr, p.id_vnd, p.id_tovar, p.c_tovar, p.c_zavod, current_timestamp, 'robot'
from prc p
join lnk l using (id_vnd, id_tovar)
where p.id_tovar<>'' and p.id_tovar <> '0' and p.id_tovar is not null and p.id_tovar<>' '
    and p.n_fg != 12 and p.n_fg != 1
    and (select count(distinct ll.id_spr)
            from lnk ll
            where ll.id_vnd = p.id_vnd and ll.id_tovar = p.id_tovar
            ) = 1
    and p.id_vnd in (select q.id_vnd from vnd q where permit = 1)"""
        dbc.execute(sql)
        dbc.execute(
            """delete from prc
using lnk
where  lnk.sh_prc = prc.sh_prc"""
        )
        if callable(db.commit):
            db.commit()

        self.log("PRCSYNC Сводим по кодам для Протека")
        sql = """ insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
    select DISTINCT p.sh_prc, l.id_spr, p.id_vnd, p.id_tovar, p.c_tovar, p.c_zavod, current_timestamp, 'robot'
    from prc p
    join lnk l on (l.id_vnd > 20200 and l.id_vnd < 20299 and l.id_vnd != 20271) and (p.id_vnd > 20200 and p.id_vnd < 20299 and p.id_vnd != 20271) and
    l.id_tovar = p.id_tovar and p.id_tovar<>'' and p.id_tovar <> '0' and p.id_tovar is not null and p.id_tovar<>' '
        and p.n_fg != 12 and p.n_fg != 1
        and (select count(distinct ll.id_spr)
                from prc pp
                join lnk ll on (pp.id_vnd > 20200 and pp.id_vnd < 20299  and pp.id_vnd != 20271) and (ll.id_vnd > 20200 and ll.id_vnd < 20299  and ll.id_vnd != 20271)
                                and ll.id_tovar = pp.id_tovar
                where (pp.id_vnd > 20200 and pp.id_vnd < 20299  and pp.id_vnd != 20271) and (p.id_vnd > 20200 and p.id_vnd < 20299  and p.id_vnd != 20271)
                       and pp.id_tovar = p.id_tovar
                ) = 1
    and p.id_vnd in (select q.id_vnd from vnd q where permit = 1 and (q.id_vnd > 20200 and q.id_vnd < 20299 and q.id_vnd != 20271));"""
        try:
            pass
            dbc.execute(sql)
        except Exception:
            self.log(traceback.format_exc(), kind="ProtekInsertError")
            self.log(sql, kind="ProtekInsertErrorSQL:")
        else:
            if callable(db.commit):
                db.commit()

        dbc.execute(
            """delete from prc
using lnk
where  lnk.sh_prc = prc.sh_prc"""
        )
        if callable(db.commit):
            db.commit()
        self.log("PRCSYNC ---Свели по кодам")
        self.log("PRCSYNC Назначаем пользователям на сведение")

        # если назначено на админа, но это не пропущенное - переназначаем на сводильщика
        # пропускаем когда работает админ
        # на время отпуска сводильщика
        dbc.execute(
            f"""update prc set id_org = 12 where id_org = 0 and n_fg = 0 {con_ins}
        and (id_vnd<>19977 and id_vnd<>30000 and id_vnd<>20271 and id_vnd<>44677 and id_vnd<>43136 and id_vnd<>19976 and id_vnd<>19987
        and id_vnd<>19973 and id_vnd<>19972 and id_vnd<>19971)"""
        )
        if callable(db.commit):
            db.commit()
        # на время отпуска сводильщика

        # назначаем на группы пользователей:
        dbc.execute(
            """select distinct v.users_group, ug.c_group
from vnd v
join users_groups ug on (v.users_group = ug.id_group)
where v.users_group is not null and v.users_group not in (12, 0)"""
        )  # не null, не админы и не сводильшики
        rows = dbc.fetchall() or []
        if rows:
            for row in rows:
                self.log(f"PRCSYNC Назначаем на сведение {row[1]}")
                dbc.execute(
                    f"""update prc set id_org={row[0]} where  (in_work = -1)
                and (n_fg = 0) and (id_org != {row[0]})
                {con_ins}
and exists (select id_vnd from vnd vv where vv.id_vnd = prc.id_vnd and vv.users_group={row[0]})"""
                )
                if callable(db.commit):
                    db.commit()
                self.log(f"PRCSYNC ---Назначили на сведение {row[1]}")

        # назначаем на сводильщиков или админов тех поставщиков, которые за ними закреплены
        dbc.execute(
            """select distinct v.users_group, ug.c_group
from vnd v
join users_groups ug on (v.users_group = ug.id_group)
where v.users_group is not null and v.users_group in (12, 0)"""
        )  # не null, админы и сводильшики
        rows = dbc.fetchall() or []
        if rows:
            for row in rows:
                self.log(f"PRCSYNC Назначаем на сведение {row[1]}")
                # назначем на админа
                # на время отпуска сводильщика
                # dbc.execute(
                #     f"""update prc set id_org = 0 where n_fg in (12,0) and in_work = -1 {con_ins}
                # and exists (
                #     select vv.id_vnd from vnd vv
                #     where vv.id_vnd = prc.id_vnd and (vv.users_group={row[0]} or vv.users_group is null)) """
                # )
                # на время отпуска сводильщика
                dbc.execute(
                    f"""update prc set id_org = {row[0]} where (id_org<>12 and id_org <> 0) and n_fg= 0 and in_work = -1 {con_ins}
                and exists (select id_vnd from vnd vv where vv.id_vnd = prc.id_vnd and vv.users_group={row[0]})"""
                )

                if callable(db.commit):
                    db.commit()
                self.log(f"PRCSYNC ---Назначили на сведение {row[1]}")

        try:
            pass
            dbc.execute(
                """update lnk set id_tovar = '' where id_tovar is null"""
            )
        except Exception:
            self.log(traceback.format_exc(), kind="LNKUpdErrr")
        else:
            if callable(db.commit):
                db.commit()

    def getNameByCode(self, id_vnd):

        vnd_name = None
        try:
            con = self.connection.connect()
            cur = con.cursor()
        except Exception as Err:
            self.log(Err, kind="SQLError")
        else:
            try:
                sql = f"""select count(*) from vnd where id_vnd = {'%s'}"""
                opt = (id_vnd,)
                cur.execute(sql, opt)
                res = int(cur.fetchone()[0])
                if res == 0:
                    # если записи нет, то вычитываем название и апдейтим базу
                    code = [id_vnd]
                    res1 = requests.post(
                        self.nauth["url"],
                        auth=(self.nauth["login"], self.nauth["pwd"]),
                        json=code,
                    )
                    res1 = res1.json()
                    vnd_name = res1.get(str(id_vnd))
                    if vnd_name:
                        sql = f"""insert into VND (ID_VND, C_VND) values ({'%s'}, {'%s'})"""
                        opt = (id_vnd, vnd_name)
                        cur.execute(sql, opt)
                        sql = f"""insert into USER_VND (ID_USER, ID_VND) values (12, {'%s'})"""
                        opt = (id_vnd,)
                        cur.execute(sql, opt)
                        con.commit()
            except Exception as Err:
                self.log(Err, kind="GetNameError")
                self.log(traceback.format_exc(), kind="GetNameError")
        finally:
            try:
                con.close()
            except Exception as Err:
                self.log(Err, kind="SQLError")
        return vnd_name


class fLock:
    """
    File locking class. Intended for use with the `with` syntax.
    """

    def __init__(self, path):
        self._path = path
        self._fd = None

    def __enter__(self):
        self._fd = os.open(self._path, os.O_CREAT)
        while True:
            try:
                fcntl.flock(
                    self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB
                )  # try to acquire the Lock
                return
            except (OSError, IOError) as ex:
                if (
                    ex.errno != errno.EAGAIN
                ):  # Resource temporarily unavailable
                    raise
            time.sleep(0.01)

    def __exit__(self, *args):
        fcntl.flock(self._fd, fcntl.LOCK_UN)
        os.close(self._fd)
        self._fd = None


def getip(log):
    """
    get ip's function
    """
    _urls = (
        "https://sklad71.org/consul/ip/",
        "http://ip-address.ru/show",
        "http://yandex.ru/internet",
        "http://ip-api.com/line/?fields=query",
        "http://icanhazip.com",
        "http://ipinfo.io/ip",
        "https://api.ipify.org",
    )
    s = r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
    eip = None
    iip = ""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as se:
            se.connect(("77.88.8.8", 80))
            iip = se.getsockname()[0]
    except Exception as e:
        log(f"err:{str(e)}")

    ssl._create_default_https_context = ssl._create_unverified_context
    for url in _urls:
        r = None
        data = ""
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                data = str(r.headers)
                data += r.read().decode()
                eip = re.findall(s, data)[0].strip()
                break
        except Exception:
            continue
    return eip, iip


class logs:
    """
    logging class
    """

    def __init__(
        self, hostname=None, version=None, appname=None, profile=None
    ):
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile

    def __call__(self, msg, kind="info", begin="", end="\n"):
        try:
            ts = "%Y-%m-%d %H:%M:%S"
            try:
                ts = time.strftime(ts)
            except Exception:
                ts = time.strftime(ts)
            if self.hostname:
                if self.profile:
                    s = "{0}{1} {2} {4}.{5}:{3}:{6} {7}{8}".format(
                        begin,
                        ts,
                        self.hostname,
                        self.version,
                        self.appname,
                        self.profile,
                        kind,
                        msg,
                        end,
                    )
                else:
                    s = "{0}{1} {2} {4}:{3}:{5} {6}{7}".format(
                        begin,
                        ts,
                        self.hostname,
                        self.version,
                        self.appname,
                        kind,
                        msg,
                        end,
                    )
            else:
                if self.profile:
                    s = "{0}{1} {3}.{4}:{2}:{5} {6}{7}".format(
                        begin,
                        ts,
                        self.version,
                        self.appname,
                        self.profile,
                        kind,
                        msg,
                        end,
                    )
                else:
                    s = "{0}{1} {3}:{2}:{4} {5}{6}".format(
                        begin, ts, self.version, self.appname, kind, msg, end
                    )
            sys.stdout.write(s)
            sys.stdout.flush()
        except Exception:
            traceback.print_exc()


class SCGIServer:
    """
    SCGI Server class
    """

    def __init__(
        self,
        log,
        hostname=None,
        version=None,
        appname=None,
        profile=None,
        index=None,
    ):
        self.log = log
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile
        self.index = index

    def serve_forever(self, addr, handle_request):
        sock = None
        if type(addr) is str:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        else:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(addr)
        # sock.listen(10)
        initial_value = None
        initial_value = self._init(sock)
        try:
            while True:
                _conn, _addr = sock.accept()
                _t = threading.Thread(
                    target=self._handle_conn,
                    args=(_conn, _addr, handle_request, initial_value),
                )
                _t.env = None
                _t.daemon = True
                _t.start()
        finally:
            try:
                sock.close()
            except Exception:
                pass

    def _handle_conn(self, conn, addr, handle_request, initial_value):
        env = None
        try:
            conn.settimeout(1)
            rfile = conn.makefile("rb", -1)
            wfile = conn.makefile("wb", 0)
            env = self._env_read(rfile)
            env = self._args_parse(env)
            env["scgi.defer"] = None
            env["scgi.initv"] = initial_value
            env["scgi.rfile"] = rfile
            env["scgi.wfile"] = wfile
            env["CONTENT_LENGTH"] = int(env["CONTENT_LENGTH"])
            threading.current_thread().env = env
            g = handle_request(env)
            wfile.write("Status: {0}\r\n".format(g.__next__()).encode())
            wfile.flush()
            for kv in g.__next__():
                wfile.write(": ".join(kv).encode())
                wfile.write(b"\r\n")
            wfile.write(b"\r\n")
            wfile.flush()
            for data in g:
                wfile.write(data)
                wfile.flush()
        except (BrokenPipeError):
            pass
        except Exception:
            self.log(conn)
            self.log(env)
            traceback.print_exc()
        finally:
            if not wfile.closed:
                try:
                    wfile.flush()
                except Exception:
                    pass
            try:
                wfile.close()
            except Exception:
                pass
            try:
                rfile.close()
            except Exception:
                pass
            try:
                conn.shutdown(socket.SHUT_WR)
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            if env and env.get("scgi.defer"):
                try:
                    env["scgi.defer"]()
                except Exception:
                    self.log(traceback.format_exc(), kind="error:defer")

    def _env_read(self, f):
        size, d = f.read(16).split(b":", 1)
        size = int(size) - len(d)
        if size > 0:
            s = f.read(size)
            if not s:
                raise IOError("short netstring read")
            if f.read(1) != b",":
                raise IOError("missing netstring terminator")
            items = b"".join([d, s]).split(b"\0")[:-1]
        else:
            raise IOError("missing netstring size")
        assert len(items) % 2 == 0, "malformed headers"
        env = {}
        while items:
            v = items.pop()
            k = items.pop()
            env[k.decode()] = v.decode()
        return env

    def _args_parse(self, env):
        args = []
        argd = {}
        for x in env.pop("ARGS", "").split("&"):
            i = x.find("=")
            if i > -1:
                k, x = x[:i], x[i + 1 :]
            else:
                k = None
            if k:
                argd[unquote(k)] = unquote(x)
            else:
                if x:
                    args.append(unquote(x))
        env["HTTP_PARAMS"] = args
        env["HTTP_KWARGS"] = argd
        return env

    def _init(self, sock):
        app_config = sys.APPCONF
        addr = sock.getsockname()[:2]
        sock.listen(10)
        app_config["addr"] = addr
        fileupstream = self._getfilename("upstream")
        app_config["fileupstream"] = fileupstream
        data = """

        location /linker_upl {
         if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';

            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
         }
         if ($request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
         }

         if ($request_method = 'HEAD') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
         }

        #if (!-f /ms71/data/linker/api-k/$http_x_api_key) {
        #return 403;
        #}

        limit_except POST HEAD OPTIONS GET{
            deny all;
        }
        autoindex                   off;
        client_body_temp_path       temp;
        client_body_in_file_only    clean;
        client_body_buffer_size     16K;
        client_max_body_size        64M;
        include scgi_params;
        #scgi_param                X-BODY-FILE $request_body_file;
        scgi_param                X-API-KEY $http_x_api_key;
        scgi_pass                 linker_upl_ups;
        scgi_buffering            off;
        scgi_cache                off;
    }

    """
        filelocation = self._getfilename("location")
        dn = os.path.dirname(filelocation)
        bs = os.path.basename(filelocation)
        _filelocation = os.path.join(
            dn, bs.split(".", 1)[0].split("-", 1)[0]
        )  # общий файл для всех экземпляров приложения
        with open(_filelocation, "wb") as f:
            f.write(data.encode())
        app_config["filelocation"] = _filelocation
        dn = os.path.dirname(fileupstream)
        bs = os.path.basename(fileupstream)
        _fileupstream = os.path.join(
            dn, bs.split(".", 1)[0].split("-", 1)[0]
        )  # общий файл для всех экземпляров приложения
        _fileupstreamlock = bs.split(".", 1)[0].split("-", 1)[
            0
        ]  # _fileupstream + '.lock'
        data1 = """upstream linker_upl_ups {
        least_conn;
        server %s:%s;  # %s
    }
    """ % (
            addr[0],
            addr[1],
            bs,
        )
        data2 = """#   server %s:%s;  # %s""" % (addr[0], addr[1], bs)
        with LockWait(_fileupstreamlock):
            if os.path.exists(_fileupstream):
                with open(_fileupstream, "rb") as f:
                    src = f.read().decode().rstrip().splitlines()
                    # + ' ' + data[1:] + '\n}\n'
                _find = "# %s" % bs
                # fg - пердполагаем, что надо добавлять свой апстрим
                fg = True
                for i in range(1, len(src) - 1):
                    if src[i].find(_find) > -1:
                        fg = False
                        src[i] = " " + data2[1:]
                        break
                if fg:
                    src[len(src) - 1] = " " + data2[1:] + "\n}\n"
                src = "\n".join(src)
                with open(_fileupstream, "wb") as f:
                    f.write(src.encode())
            else:
                with open(_fileupstream, "wb") as f:
                    f.write(data1.encode())
        rc = 0
        rc = subprocess.call(
            ["sudo", "nginx", "-t", "-c", "/ms71/saas.conf", "-p", "/ms71/"]
        )
        # stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if 0 == rc:
            rc = subprocess.call(
                [
                    "sudo",
                    "nginx",
                    "-s",
                    "reload",
                    "-c",
                    "/ms71/saas.conf",
                    "-p",
                    "/ms71/",
                ]
            )
            if 0 == rc:
                self.log("%s:%s running" % addr)
                return [addr, os.getpid()]
        raise SystemExit(rc)

    def _getfilename(self, name):
        filename = ""
        nginx_name = sys.APPCONF["nginx"][name]
        if self.index > -1:
            if self.profile:
                filename = os.path.join(
                    nginx_name,
                    "%s-%s.%s" % (self.appname, self.index, self.profile),
                )
            else:
                filename = os.path.join(
                    nginx_name, "%s-%s" % (self.appname, self.index)
                )
        else:
            if self.profile:
                filename = os.path.join(
                    nginx_name, "%s.%s" % (self.appname, self.profile)
                )
            else:
                filename = os.path.join(nginx_name, self.appname)
        return filename


def head(aContentLength, fgDeflate=True, fg_head=True):
    """
    make a header of response function
    """

    aLastModified = time.strftime("%a, %d %b %Y %X GMT", time.gmtime())
    r = []
    r.append(("Last-Modified", "%s" % aLastModified))
    r.append(("Content-Length", "%i" % aContentLength))
    r.append(("X-Accel-Buffering", "no"))
    if fg_head:
        r.append(("Content-Type", "application/json"))
    else:
        r.append(("Cache-Control", "no-cache"))
        r.append(("Content-Type", "text/plain; charset=UTF-8"))
    if fgDeflate:
        r.append(("Content-Encoding", "deflate"))
    return r


def shutdown(log):
    """
    function, runs when exiting
    """

    app_conf = sys.APPCONF
    fileupstream = app_conf.get("fileupstream")
    if fileupstream is None:
        log("%s:%s critical" % app_conf["addr"], begin="")
        return
    try:
        os.remove(fileupstream)
    except Exception:
        pass
    dn = os.path.dirname(fileupstream)
    bs = os.path.basename(fileupstream)
    _fileupstream = os.path.join(dn, bs.split(".", 1)[0].split("-", 1)[0])
    _fileupstreamlock = bs.split(".", 1)[0].split("-", 1)[0]
    with LockWait(_fileupstreamlock):
        _find = "# %s" % bs
        src = ""
        fg_noapp = True
        if os.path.exists(_fileupstream):
            with open(_fileupstream, "rb") as f:
                src = f.read().decode().rstrip().splitlines()
            for i in range(1, len(src) - 1):
                if src[i].find(_find) > -1:
                    src.pop(i)
                    break
            fg_noapp = 0 == len(src[2:-1])
        if (
            fg_noapp
        ):  # нет запущенных приложений, удаляем общую локацию и апстрим
            try:
                os.remove(app_conf["filelocation"])
            except Exception:
                pass
            try:
                os.remove(_fileupstream)
            except Exception:
                pass
        else:
            src = "\n".join(src)
            with open(_fileupstream, "wb") as f:
                f.write(src.encode())

    subprocess.call(
        [
            "sudo",
            "nginx",
            "-s",
            "reload",
            "-c",
            "/ms71/saas.conf",
            "-p",
            "/ms71/",
        ]
    )
    log("%s:%s shutdown" % app_conf["addr"], begin="")


def _int(x):
    try:
        fx = float(x)
        ix = int(fx)
        return ix if ix == fx else fx
    except Exception:
        return x


def parse_args(arg, _param, x_hash, api):
    try:
        call = getattr(api, arg)
    except Exception:
        content = json.dumps(
            {"result": False, "ret_val": "'%s' not implimented method"} % arg,
            ensure_ascii=False,
        )
    else:
        if x_hash:
            try:
                content = call(_param, x_hash)
            except Exception:
                res = {
                    "result": False,
                    "ret_val": "error in method '%s'" % arg,
                }
                api.log("CALL ERROR: %s" % traceback.format_exc())
                # content = json.dumps(u'use \'%s\' with correct parameters' % arg, ensure_ascii=False)
                content = json.dumps(res, ensure_ascii=False)
        else:
            content = json.dumps(
                {"result": False, "ret_val": "login please"},
                ensure_ascii=False,
            )
    return content


def handle_commandline(profile, index):
    args = []
    kwargs = {}
    sys.stdin.close()
    _argv = sys.argv[1:]
    for x in _argv:
        i = x.find("=")
        if i > -1:
            k, x = x[:i], x[i + 1 :]
        else:
            k = None
        if k:
            v = unquote(x).split(",")
            if len(v) > 1:
                kwargs[unquote(k)] = tuple(_int(x) for x in v)
            else:
                kwargs[unquote(k)] = _int(v[0])
        else:
            if x:
                v = unquote(x).split(",")
                if len(v) > 1:
                    args.append(tuple(_int(x) for x in v))
                else:
                    args.append(_int(v[0]))
    if "profile" in kwargs:
        profile = kwargs.pop("profile")
    if "index" in kwargs:
        index = kwargs.pop("index")
    return args, kwargs, profile, index


def guardian(api):
    time.sleep(2)
    work_dir = api.path
    log = api.log
    c_pool = connect_pool.ConectPool(
        pool_size=2, connection_params=api.pg_connect_params
    )
    while True:
        try:
            f_mask = os.path.join(work_dir, "*")
            for path in glob.glob(f_mask):
                if os.path.isdir(path):
                    continue
                row = None
                log(f"GUARDIAN| path: {path}")
                with open(path, "rb") as f_obj:
                    row = f_obj.readline()
                if row:
                    row = row.decode("utf8")
                    try:
                        id_vnd = path.split(".")
                        id_vnd = int(id_vnd[-2])
                    except Exception:
                        id_vnd = int(row.split("\t")[0])
                    db = c_pool.connect()
                    # db = psycopg2.connect(**api.pg_connect_params)
                    dbc = db.cursor()
                    if id_vnd:
                        # если есть id_vnd, то проверяем его наличие в базе,
                        # если его нет - добавляем
                        api.getNameByCode(id_vnd)
                    # пропускаем если явно запрещено
                    sql = f"""SELECT count(*)
FROM LNK_CODES r where r.PROCESS = 0 and r.CODE = {id_vnd}"""
                    dbc.execute(sql)
                    h_name = os.path.basename(path)
                    try:
                        h_name, _, source = h_name.split(".")
                    except Exception:
                        source = 1
                    log(f"----source---- {source}")
                    # заплатка чтоб сводилось все
                    if list(dbc.fetchone())[0]:  # and int(source) != 2:
                        # if not list(dbc.fetchone())[0]:# and int(source) != 2:
                        log(
                            f"GUARDIAN| {h_name}|  пропускаем, сведение не разрешено"
                        )
                        # переносим файл в несводимые, делаем запись
                        # в базе о том, что сведение не разрешено
                        sql = (
                            f"""delete from PRC_TASKS where uin = '{h_name}'"""
                        )
                        dbc.execute(sql)
                        db.commit()
                        shutil.move(path, os.path.join(api.p_path, h_name))
                        continue
                    else:
                        log(f"GUARDIAN| {h_name}| начинаем сведение")
                        count_insert = 0
                        count_all = 0
                        try:
                            (
                                count_insert,
                                count_all,
                                uniq_sh_prc,
                            ) = api.upload_to_db(
                                db,
                                dbc,
                                id_vnd,
                                path,
                                count_insert,
                                count_all,
                                int(source),
                            )
                        except Exception:
                            log(f"GUARDIAN| CRITICAL | {h_name}")
                            log(f"error text:\n {traceback.format_exc()}")
                            shutil.move(
                                path, os.path.join(api.skip_path, h_name)
                            )
                            ##############################################
                            # отправляем куда-нибудь алерт
                            ##############################################
                        else:
                            log(f"GUARDIAN| {h_name}| удаляем файл:")
                            try:
                                shutil.move(
                                    path, os.path.join(api.inw_path, h_name)
                                )
                                log(f"GUARDIAN| {h_name}| [ OK ]")
                            except Exception as e:
                                log(f"GUARDIAN| {h_name}| [FAIL]")
                                log("GUARDIAN| %s" % str(e), kind="error")
                            if count_insert > 0:
                                api.prc_sync_lnk(db, dbc, h_name)
                                sql = f"""select count(*) from PRC r where r.n_fg != 1 and r.UIN = '{h_name}'"""
                                dbc.execute(sql)
                                count_insert = dbc.fetchone()[0]
                            log(
                                f"GUARDIAN| {h_name}| [insert]| {count_insert}"
                            )
                            log(f"GUARDIAN| {h_name}| [total]| {count_all}")
                            log(
                                f"GUARDIAN| {h_name}| [u_sh_prc]| {uniq_sh_prc}"
                            )
                    api.log(
                        f"GUARDIAN| {h_name}| Добавленно к сведению: {count_insert}"
                    )
                    db.close()
            # db = psycopg2.connect(**api.pg_connect_params)
            db = c_pool.connect()
            dbc = db.cursor()
            api.log("GUARDIAN| ---***---принудительный запуск")
            api.prc_sync_lnk(db, dbc)
            db.close()
        except Exception:
            api.log(
                "GUARDIAN| %s" % traceback.format_exc(), kind="error:monitor"
            )
        # спим 30 секунд перед тем, как продолжить опрос папки
        time.sleep(30)
