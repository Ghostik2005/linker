#!/usr/bin/python
# coding: utf-8

import zipfile
import os
import sys
import glob


def main():
    c_path = os.getcwd()
    zip_name = os.path.basename(c_path) + '.zip'
    if not os.path.exists('./deploy/'):
        print('You have to copy all files and libraries to /deploy dir')
        sys.exit(0)
    os.chdir('./deploy/')
    z_f_name = os.path.join(c_path, zip_name)
    if os.path.exists(z_f_name):
        os.remove(z_f_name)

    myzip = zipfile.ZipFile(z_f_name, 'a')
    for file_name in gen_names():
        print(file_name, end = ' --> ')
        myzip.write(file_name)
        print('added to %s'%zip_name)
    myzip.close()
    print(zip_name, 'successfully created')


def gen_names():
    
    for root, dirs, files in os.walk('.'): # Список всех файлов и папок в директории folder
        for filen in files:
            qq = os.path.join(root, filen)
            yield qq
    
    




if "__main__" == __name__:
    
    main()
