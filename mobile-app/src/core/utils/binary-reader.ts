/**
 * BinaryReader universal de alta performance.
 * Compatível com DataView, ArrayBuffer, Uint8Array e Node.js Buffer.
 * Otimizado para o motor Hermes do React Native e V8 do Node.
 */
export class BinaryReader {
  private view: DataView;
  private offset: number;
  private length: number;

  constructor(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer; byteOffset?: number; byteLength?: number }, initialOffset = 0) {
    if (data instanceof DataView) {
      this.view = data;
      this.length = data.byteLength;
    } else if (data instanceof Uint8Array || (typeof Buffer !== 'undefined' && data instanceof Buffer)) {
      this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      this.length = data.byteLength;
    } else if (data instanceof ArrayBuffer) {
      this.view = new DataView(data);
      this.length = data.byteLength;
    } else if (data && typeof data === 'object' && 'buffer' in data) {
      this.view = new DataView(data.buffer, (data as any).byteOffset || 0, (data as any).byteLength || data.buffer.byteLength);
      this.length = (data as any).byteLength || data.buffer.byteLength;
    } else {
      throw new TypeError('Tipo de dado inválido para BinaryReader.');
    }

    this.offset = initialOffset;
  }

  public getOffset(): number {
    return this.offset;
  }

  public setOffset(offset: number): void {
    if (offset < 0 || offset > this.length) {
      throw new RangeError(`Offset ${offset} fora dos limites (${this.length} bytes).`);
    }
    this.offset = offset;
  }

  public skip(bytes: number): void {
    this.checkBounds(bytes);
    this.offset += bytes;
  }

  public remainingBytes(): number {
    return Math.max(0, this.length - this.offset);
  }

  public hasRemaining(bytes: number): boolean {
    return this.offset + bytes <= this.length;
  }

  public readUInt8(): number {
    this.checkBounds(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  public readInt8(): number {
    this.checkBounds(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  public readUInt16LE(): number {
    this.checkBounds(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  public readInt16LE(): number {
    this.checkBounds(2);
    const value = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return value;
  }

  public readUInt32LE(): number {
    this.checkBounds(4);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  public readInt32LE(): number {
    this.checkBounds(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  public readFloatLE(): number {
    this.checkBounds(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  public readBigUInt64LE(): bigint {
    this.checkBounds(8);
    if (typeof this.view.getBigUint64 === 'function') {
      const value = this.view.getBigUint64(this.offset, true);
      this.offset += 8;
      return value;
    }

    const low = BigInt(this.view.getUint32(this.offset, true));
    const high = BigInt(this.view.getUint32(this.offset + 4, true));
    this.offset += 8;
    return (high << 32n) | low;
  }

  public readString(length: number): string {
    this.checkBounds(length);
    let str = '';
    let isNullTerminated = false;

    for (let i = 0; i < length; i++) {
      const code = this.view.getUint8(this.offset + i);
      if (code === 0) {
        isNullTerminated = true;
      }
      if (!isNullTerminated) {
        str += String.fromCharCode(code);
      }
    }

    this.offset += length;
    return str;
  }

  private checkBounds(bytesNeeded: number): void {
    if (this.offset + bytesNeeded > this.length) {
      throw new RangeError(
        `Buffer insuficiente: tentando ler ${bytesNeeded} bytes no offset ${this.offset}, mas buffer possui ${this.length} bytes.`
      );
    }
  }
}
