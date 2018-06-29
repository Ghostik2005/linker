#coding: utf-8

import requests
import configparser

def main():
    config = configparser.ConfigParser()
    config.read('/ms71/saas/linker/conf.ini', encoding='UTF-8')
    nauth = config['nauth']
    init = config['init']
    connect_params = {
            "host": "127.0.0.1",
            "port": 8025,
            "database": "spr",
            "user": 'SYSDBA',
            "password":'masterkey',
            "charset" : 'WIN1251'
        }
    codes = [{'34571': 'рфарм'}, 
{'38977': 'МЕДАРГО'}, 
{'39350': 'сиэсмедика50'}, 
{'42477': 'мирлечкос'}, 
{'43376': 'рокс'}, 
{'43576': 'вернигор'}, 
{'43671': 'Тулдетопт(Кудинов)'}, 
{'44971': 'борисов'}, 
{'48276': 'ярвет'}, 
{'48835': 'Важенина'}, 
{'49235': 'Мелисса'}, 
{'49435': 'Дзинтарса'}, 
{'49635': 'СК-трейд'}, 
{'49935': 'МираМисс'}, 
{'51002': 'ЭЛИТА (ИНВЕСТИЦИЯ) OOO'}, 
{'51005': 'Марушин АГ'}, 
{'51007': 'Новрузов ИП'}, 
{'51008': 'Никомед'}, 
{'51009': 'Аламед (Крейт)'}, 
{'51010': 'Коробова ИП'}, 
{'51011': 'БКТ'}, 
{'51015': 'медимпульс'}, 
{'51051': 'прайд(ип голяков)'}, 
{'51058': 'фарма-плюс'}, 
{'51079': 'смарт-беби'}, 
{'51088': 'аквакосметика'}, ]
    try:
        import libs.fdb as fdb
    except ImportError:
        import fdb
    con = fdb.connect(**connect_params)
    print(con)
    cur = con.cursor()
    cur.execute("""select * from users """)
    print(dir(cur))
    sql = """insert into VND (ID_VND, C_VND) values (?, ?)"""
    sql1 = """insert into USER_VND (ID_USER, ID_VND) values (12, ?)"""
    for cc in codes:
        qw = list(cc.popitem())
        opt = (qw[0], qw[1])
        opt1 = (qw[0],)
        print(opt)
        cur.execute(sql, opt)
        con.commit()
        cur.execut(sql1, opt1)
        con.commit()

    #con.commit()

    con.close()
        
    #code = '20171'
    #res = requests.post(nauth['url'], auth=(nauth['login'], nauth['pwd']),  json={"method": "namepost", "params": [code]})
    #res = res.json().get('result')[0]
    #print(code, res.get(code))

if "__main__" == __name__:
    main()
