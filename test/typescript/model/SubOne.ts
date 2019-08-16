import { property, Supertype, supertypeClass } from "../../../dist/index";

@supertypeClass
export class SubOne extends Supertype {
    @property()
    name: String = '';
    constructor(name) {
        super();
        this.name = name;
    }
};