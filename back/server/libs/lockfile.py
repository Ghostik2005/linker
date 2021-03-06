# coding: utf-8

import os
import sys
import stat
import time
import random
import tempfile
import threading
import traceback

try:
    import warnings
except ImportError:
    warnings = None
try:
    import msvcrt
except ImportError:
    msvcrt = None
try:
    import fcntl
except ImportError:
    fcntl = None

__all__ = [
    "BaseFileLock",
    "WindowsFileLock",
    "UnixFileLock",
    "SoftFileLock",
    "FileLock"
]

__version__ = "2.0.8"

# Classes
# ------------------------------------------------
class BaseFileLock(object):
    """
    Implements the base class of a file lock.
    """

    def __init__(self, lock_file, timeout = -1):
        """
        """
        # The path to the lock file.
        self._lock_file = lock_file

        # The file descriptor for the *_lock_file* as it is returned by the
        # os.open() function.
        # This file lock is only NOT None, if the object currently holds the
        # lock.
        self._lock_file_fd = None

        # The default timeout value.
        self.timeout = timeout

        # We use this lock primarily for the lock counter.
        self._thread_lock = threading.Lock()

        # The lock counter is used for implementing the nested locking
        # mechanism. Whenever the lock is acquired, the counter is increased and
        # the lock is only released, when this value is 0 again.
        self._lock_counter = 0
        return None

    @property
    def lock_file(self):
        """
        The path to the lock file.
        """
        return self._lock_file

    @property
    def timeout(self):
        """
        You can set a default timeout for the filelock. It will be used as
        fallback value in the acquire method, if no timeout value (*None*) is
        given.

        If you want to disable the timeout, set it to a negative value.

        A timeout of 0 means, that there is exactly one attempt to acquire the
        file lock.

        .. versionadded:: 2.0.0
        """
        return self._timeout

    @timeout.setter
    def timeout(self, value):
        """
        """
        self._timeout = float(value)
        return None

    # Platform dependent locking
    # --------------------------------------------

    def _acquire(self):
        """
        Platform dependent. If the file lock could be
        acquired, self._lock_file_fd holds the file descriptor
        of the lock file.
        """
        raise NotImplementedError()

    def _release(self):
        """
        Releases the lock and sets self._lock_file_fd to None.
        """
        raise NotImplementedError()

    # Platform independent methods
    # --------------------------------------------

    @property
    def is_locked(self):
        """
        True, if the object holds the file lock.

        .. versionchanged:: 2.0.0

            This was previously a method and is now a property.
        """
        return self._lock_file_fd is not None

    def acquire(self, timeout=None, poll_intervall=0.05):
        """
        Acquires the file lock or fails with a :exc:`Timeout` error.

        .. code-block:: python

            # You can use this method in the context manager (recommended)
            with lock.acquire():
                pass

            # Or you use an equal try-finally construct:
            lock.acquire()
            try:
                pass
            finally:
                lock.release()

        :arg float timeout:
            The maximum time waited for the file lock.
            If ``timeout <= 0``, there is no timeout and this method will
            block until the lock could be acquired.
            If ``timeout`` is None, the default :attr:`~timeout` is used.

        :arg float poll_intervall:
            We check once in *poll_intervall* seconds if we can acquire the
            file lock.

        :raises Timeout:
            if the lock could not be acquired in *timeout* seconds.

        .. versionchanged:: 2.0.0

            This method returns now a *proxy* object instead of *self*,
            so that it can be used in a with statement without side effects.
        """
        # Use the default timeout, if no timeout is provided.
        if timeout is None:
            timeout = self.timeout

        # Increment the number right at the beginning.
        # We can still undo it, if something fails.
        with self._thread_lock:
            self._lock_counter += 1

        try:
            start_time = time.time()
            while True:
                with self._thread_lock:
                    if not self.is_locked:
                        self._acquire()
                if self.is_locked:
                    break
                elif timeout >= 0 and time.time() - start_time > timeout:
                    temp = "The file lock '%s' could not be acquired." % self._lock_file
                    raise RuntimeError(temp)
                else:
                    time.sleep(poll_intervall)
        except:
            # Something did go wrong, so decrement the counter.
            with self._thread_lock:
                self._lock_counter = max(0, self._lock_counter - 1)
            raise

        # This class wraps the lock to make sure __enter__ is not called
        # twiced when entering the with statement.
        # If we would simply return *self*, the lock would be acquired again
        # in the *__enter__* method of the BaseFileLock, but not released again
        # automatically.
        class ReturnProxy(object):

            def __init__(self, lock):
                self.lock = lock
                return None

            def __enter__(self):
                return self.lock

            def __exit__(self, exc_type, exc_value, traceback):
                self.lock.release()
                return None

        return ReturnProxy(lock = self)

    def release(self, force = False):
        """
        Releases the file lock.

        Please note, that the lock is only completly released, if the lock
        counter is 0.

        Also note, that the lock file itself is not automatically deleted.

        :arg bool force:
            If true, the lock counter is ignored and the lock is released in
            every case.
        """
        with self._thread_lock:

            if self.is_locked:
                self._lock_counter -= 1

                if self._lock_counter == 0 or force:
                    lock_id = id(self)
                    lock_filename = self._lock_file

                    self._release()
                    self._lock_counter = 0
        return None

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.release()
        return None

    def __del__(self):
        self.release(force = True)
        return None


# Windows locking mechanism
# ~~~~~~~~~~~~~~~~~~~~~~~~~

class WindowsFileLock(BaseFileLock):
    """
    Uses the :func:`msvcrt.locking` function to hard lock the lock file on
    windows systems.
    """

    def _acquire(self):
        open_mode = os.O_RDWR | os.O_CREAT | os.O_TRUNC

        try:
            fd = os.open(self._lock_file, open_mode)
        except OSError:
            pass
        else:
            try:
                msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            except (IOError, OSError):
                os.close(fd)
            else:
                self._lock_file_fd = fd
        return None

    def _release(self):
        fd = self._lock_file_fd
        self._lock_file_fd = None
        msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
        os.close(fd)

        try:
            os.remove(self._lock_file)
        # Probably another instance of the application
        # that acquired the file lock.
        except OSError:
            pass
        return None

# Unix locking mechanism
# ~~~~~~~~~~~~~~~~~~~~~~

class UnixFileLock(BaseFileLock):
    """
    Uses the :func:`fcntl.flock` to hard lock the lock file on unix systems.
    """

    def _acquire(self):
        open_mode = os.O_RDWR | os.O_CREAT | os.O_TRUNC
        fd = os.open(self._lock_file, open_mode)

        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (IOError, OSError):
            os.close(fd)
        else:
            self._lock_file_fd = fd
        return None

    def _release(self):
        fd = self._lock_file_fd
        self._lock_file_fd = None
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)
        return None

# Soft lock
# ~~~~~~~~~

class SoftFileLock(BaseFileLock):
    """
    Simply watches the existence of the lock file.
    """

    def _acquire(self):
        open_mode = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_TRUNC
        try:
            fd = os.open(self._lock_file, open_mode)
        except (IOError, OSError):
            pass
        else:
            self._lock_file_fd = fd
        return None

    def _release(self):
        os.close(self._lock_file_fd)
        self._lock_file_fd = None

        try:
            os.remove(self._lock_file)
        # The file is already deleted and that's what we want.
        except OSError:
            pass
        return None


# Platform filelock
# ~~~~~~~~~~~~~~~~~

#: Alias for the lock, which should be used for the current platform. On
#: Windows, this is an alias for :class:`WindowsFileLock`, on Unix for
#: :class:`UnixFileLock` and otherwise for :class:`SoftFileLock`.
FileLock = None

if msvcrt:
    FileLock = WindowsFileLock
elif fcntl:
    FileLock = UnixFileLock
else:
    FileLock = SoftFileLock
    if warnings is not None:
        warnings.warn("only soft file lock is available")


def wLock(name=None):
    global _path_lockdir
    if name:
         lock_path = os.path.join(_path_lockdir, name + '.lock')
    else:
         lock_path = os.path.join(_path_lockdir, '.lock')
    _lock = FileLock(lock_path)
    _pi = round(0.05 + random.randint(1,10) / 100.0, 2)
    lck = _lock.acquire(timeout=-1, poll_intervall=_pi)
    return lck

def _path_init_dir():
    global _path_lockdir
    lockdir = os.path.join(tempfile.gettempdir(), 'ms71', 'lock')
    os.makedirs(lockdir, mode=0o777, exist_ok=True)
    os.chmod(os.path.dirname(lockdir), stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | \
        stat.S_IRGRP | stat.S_IWGRP | stat.S_IXGRP | \
        stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH
    )
    os.chmod(lockdir, stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | \
        stat.S_IRGRP | stat.S_IWGRP | stat.S_IXGRP | \
        stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH
    )
    _path_lockdir = lockdir


_path_lockdir = None
_path_init_dir()


def test():
    pid = os.getpid()
    print(pid, "wait", flush=True)
    with wLock('test'):
        for i in range(10):
            print(pid, "locker", i, flush=True)
            time.sleep(1 + random.random())


if "__main__" == __name__:
    test()
