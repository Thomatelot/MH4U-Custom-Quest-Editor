import struct
def lmd_strings(d):
    count = struct.unpack_from('<I', d, 8)[0]
    tbl = struct.unpack_from('<I', d, 28)[0]
    out = []
    for i in range(count):
        p, a, b = struct.unpack_from('<III', d, tbl + 12 * i)
        s = d[p:p + 2 * a].decode('utf-16le', 'replace')
        out.append(s.split('\0')[0])
    return out
