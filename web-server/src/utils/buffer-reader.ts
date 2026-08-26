/**
 * Utilitário de leitura de Buffer binário Little-Endian para alta performance.
 */
export class BufferReader {
  private buffer: Buffer;
  private offset: number;

  constructor(buffer: Buffer, initialOffset = 0) {
    this.buffer = buffer;
    this.offset = initialOffset;
  }

  public getOffset(): number {
    return this.offset;
  }

  public setOffset(offset: number): void {
    if (offset < 0 || offset > this.buffer.length) {
      throw new RangeError(`Offset ${offset} está fora dos limites do buffer (${this.buffer.length} bytes).`);
    }
    this.offset = offset;
  }

  public skip(bytes: number): void {
    this.checkBounds(bytes);
    this.offset += bytes;
  }

  public remainingBytes(): number {
    return Math.max(0, this.buffer.length - this.offset);
  }

  public hasRemaining(bytes: number): boolean {
    return this.offset + bytes <= this.buffer.length;
  }

  public readUInt8(): number {
    this.checkBounds(1);
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  public readInt8(): number {
    this.checkBounds(1);
    const value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  public readUInt16LE(): number {
    this.checkBounds(2);
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  public readInt16LE(): number {
    this.checkBounds(2);
    const value = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  public readUInt32LE(): number {
    this.checkBounds(4);
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  public readInt32LE(): number {
    this.checkBounds(4);
    const value = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  public readFloatLE(): number {
    this.checkBounds(4);
    const value = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  public readBigUInt64LE(): bigint {
    this.checkBounds(8);
    const value = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  public readString(length: number): string {
    this.checkBounds(length);
    const slice = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    // Localizar primeiro byte nulo para strings terminadas em null
    const nullIdx = slice.indexOf(0);
    const effectiveSlice = nullIdx === -1 ? slice : slice.subarray(0, nullIdx);
    return effectiveSlice.toString('utf-8');
  }

  private checkBounds(bytesNeeded: number): void {
    if (this.offset + bytesNeeded > this.buffer.length) {
      throw new RangeError(
        `Buffer insuficiente: tentando ler ${bytesNeeded} bytes no offset ${this.offset}, mas buffer possui ${this.buffer.length} bytes.`
      );
    }
  }
}
