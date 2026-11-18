import struct, zlib
def read_arc(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'ARC\0', path
    ver, n = struct.unpack_from('<HH', d, 4)
    off = 0x0C if ver == 0x13 else 8
    out = []
    for i in range(n):
        e = off + i * 0x50
        name = d[e:e+64].split(b'\0')[0].decode('latin1')
        th, csize, dsize, doff = struct.unpack_from('<IIII', d, e + 64)
        raw = d[doff:doff+csize]
        try: data = zlib.decompress(raw)
        except Exception: data = raw
        out.append({'name': name, 'type': th, 'data': data})
    return out
