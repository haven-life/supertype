import { expect } from 'chai';
import { SubOne } from './model/SubOne';
import { SubMany } from './model/SubMany';
import { Main } from './model/Main';
import { SubOneExtended } from './model/SubOneExtended';
import { SubManyExtended } from './model/SubManyExtended';

var main = new Main('main');
main.subA = new SubOne('mainOneA');
main.subB = new SubOneExtended('mainOneB');

main.addSubManyA(new SubMany('mainManyA'));
main.addSubManyB(new SubMany('mainManyB'));
main.addSubManyB(new SubManyExtended('mainManyExtendedB'));

main.amorphic.getClasses();

it('can clone', function () {
    var main2 = main.createCopy(function (obj, prop, template) {
        console.log(template.__name__);
        switch (template.__name__) {
            case 'Main':
                return null; // Clone normally
        }
        switch (obj.__template__.__name__ + '.' + prop) {
            case 'Main.subA':
                return undefined;  // Don't clone
            case 'Main.subsA':
                return undefined;	// Don't clone
        }
        return null;    // normal create process
    });
    expect(main2.subA).to.equal(null);
    expect(main2.subB.name).to.equal('mainOneB');
    expect(main2.subB instanceof SubOneExtended).to.equal(true);
    expect(main2.subsB[0].name).to.equal('mainManyB');
    expect(main2.subsB[1].name).to.equal('mainManyExtendedB');
    expect(main2.subsB[1] instanceof SubManyExtended);
    expect(main2.subsA.length).to.equal(0);
    expect(main2.subsB.length).to.equal(2);
    expect(main2.subA).to.equal(null);
});
