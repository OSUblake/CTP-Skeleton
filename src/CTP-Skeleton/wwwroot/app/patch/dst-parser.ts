namespace CTP.patch {

    export type dstRead = (file: jDataView, pattern: Pattern) => void;

    export enum StitchType {
        Normal = 0,
        Jump = 1,
        Trim = 2,
        Stop = 4,
        End = 8
    }
    
    function decodeExp(b2: number) {
        
        var returnCode = 0;

        if (b2 === 0xF3) {
            return StitchType.End;
        }
        if ((b2 & 0xC3) === 0xC3) {
            return StitchType.Trim | StitchType.Stop;
        }
        if (b2 & 0x80) {
            returnCode |= StitchType.Trim;
        }
        if (b2 & 0x40) {
            returnCode |= StitchType.Stop;
        }
        return returnCode;
    }

    function dstRead(file: jDataView, pattern: Pattern) {

        var b = [];
        var x = 0;
        var y = 0;

        var flags    = 0;
        var prevJump = 0;
        var thisJump = 0;

        var byteCount = file.byteLength;

        file.seek(512);

        while (file.tell() < (byteCount - 3)) {

            x = 0;
            y = 0;

            b[0] = file.getUint8();
            b[1] = file.getUint8();
            b[2] = file.getUint8();
            
            if (b[0] & 0x01) x += 1;
            if (b[0] & 0x02) x -= 1;
            if (b[0] & 0x04) x += 9;
            if (b[0] & 0x08) x -= 9;
            if (b[0] & 0x80) y += 1;
            if (b[0] & 0x40) y -= 1;
            if (b[0] & 0x20) y += 9;
            if (b[0] & 0x10) y -= 9;
            if (b[1] & 0x01) x += 3;
            if (b[1] & 0x02) x -= 3;
            if (b[1] & 0x04) x += 27;
            if (b[1] & 0x08) x -= 27;
            if (b[1] & 0x80) y += 3;
            if (b[1] & 0x40) y -= 3;
            if (b[1] & 0x20) y += 27;
            if (b[1] & 0x10) y -= 27;
            if (b[2] & 0x04) x += 81;
            if (b[2] & 0x08) x -= 81;
            if (b[2] & 0x20) y += 81;
            if (b[2] & 0x10) y -= 81;

            x *= 0.5;
            y *= 0.5;

            flags = decodeExp(b[2]);
            thisJump = flags & StitchType.Jump;

            if (prevJump) {
                flags |= StitchType.Jump;
            }
            pattern.addStitchRel(x, y, flags, true);
            prevJump = thisJump;
        }
        pattern.addStitchRel(0, 0, StitchType.End, true);
        pattern.invertPatternVertical();
    }

    patchModule
        .value("decodeExp", decodeExp)
        .value("dstRead", dstRead)
        .value("StitchType", StitchType);
}