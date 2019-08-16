import { supertypeClass, Supertype, property } from "../../../dist";
import { SubOne } from "./SubOne";
import { SubMany } from "./SubMany";

@supertypeClass
export class Main extends Supertype {

    @property()
    name: String = '';
    constructor(name) {
        super();
        this.name = name;
    }
    @property({ getType: () => SubOne })
    subA: SubOne;
    @property({ getType: () => SubOne })
    subB: SubOne;
    @property({ getType: () => SubMany })
    subsA: Array<SubMany> = [];
    @property({ getType: () => SubMany })
    subsB: Array<SubMany> = [];
    addSubManyA(subMany) {
        subMany.main = this;
        this.subsA.push(subMany);
    }
    addSubManyB(subMany) {
        subMany.main = this;
        this.subsB.push(subMany);
    }
};
