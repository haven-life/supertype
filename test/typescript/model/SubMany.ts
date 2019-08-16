import { property, Supertype, supertypeClass } from "../../../dist";

@supertypeClass
export class SubMany extends Supertype {
    @property()
    main: any; //Typing this any because circular refs not allowed es6
    @property()
    name: String = '';
    constructor(name) {
        super();
        this.name = name;
    }
};