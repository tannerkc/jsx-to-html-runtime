export class StringBuilder {
    private parts: string[] = [];

    append(value: string): void {
        this.parts.push(value);
    }

    toString(join = ""): string {
        return this.parts.join(join);
    }
}
