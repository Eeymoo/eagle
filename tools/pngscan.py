#!/usr/bin/env python3
"""Zero-dependency PNG analysis for UI automation (scanlines → pixels)."""
import sys, zlib, struct

def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos, w, h, bitd, color, bd = 8, 0, 0, 0, 0, None
    idat = b''
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos+8])
        chunk = data[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w, h, bitd, color = struct.unpack('>IIBB', chunk[:10])
        elif typ == b'IDAT':
            idat += chunk
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0:1, 2:3, 4:2, 6:4}[color]
    stride = w * ch
    # un-filter
    out = bytearray(w * h * ch)
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i+stride]); i += stride
        if f == 1:
            for x in range(ch, stride): line[x] = (line[x] + line[x-ch]) & 255
        elif f == 2:
            for x in range(stride): line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                b = prev[x]; c = prev[x-ch] if x >= ch else 0
                p = a + b - c
                pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w, h, ch, out

def pixel(w, ch, buf, x, y):
    o = (y * w + x) * ch
    return tuple(buf[o:o+3]) if ch >= 3 else (buf[o],)*3

if __name__ == '__main__':
    mode = sys.argv[1]
    w, h, ch, buf = read_png(sys.argv[2])
    if mode == 'gear':
        region = [(x, y) for y in range(int(h*0.03), int(h*0.12), 4)
                        for x in range(int(w*0.75), w, 4)
                        if sum(pixel(w, ch, buf, x, y)) > 350]
        if region:
            xs = [p[0] for p in region]; ys = [p[1] for p in region]
            print(sum(xs)//len(xs), sum(ys)//len(ys))
        else:
            print('none')
    elif mode == 'brightrows':
        for y in range(0, h, 10):
            cnt = sum(1 for x in range(0, w, 10) if sum(pixel(w, ch, buf, x, y)) > 250)
            if cnt > 15:
                print(y, cnt)
    elif mode == 'diff':
        # 两图差异区域(找表单/按钮变化)
        w2, h2, ch2, buf2 = read_png(sys.argv[3])
        pts = [(x, y) for y in range(0, min(h, h2), 8) for x in range(0, min(w, w2), 8)
               if abs(sum(pixel(w, ch, buf, x, y)) - sum(pixel(w2, ch2, buf2, x, y))) > 60]
        if pts:
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            print('diff bbox:', min(xs), min(ys), max(xs), max(ys), 'n=', len(pts))
        else:
            print('no diff')
