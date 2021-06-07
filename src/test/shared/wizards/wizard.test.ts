/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wizard } from "../../../shared/wizards/wizard"
import { WizardCommand, WizardCommandType, WizardTester } from './wizardFramework'
import * as assert from 'assert'
import { Prompter } from '../../../shared/ui/prompter'

import { initializeInterface } from '../../../shared/transformers'
import { createQuickPick, DataQuickPickItem, QuickPickPrompter } from "../../../shared/ui/picker"
import { createInputBox } from "../../../shared/ui/input"

interface TestObject {
    prop1: string
    prop2: string
}

interface TestWizardForm {
    prop1: string
    prop2: number
    prop3: TestObject
    nestedProp1: {
        prop1: string
        prop2: boolean
    }
    nestedProp2: {
        prop1: string
        prop2: number
    }
}

function createTestPrompter<T>(...items: T[]): QuickPickPrompter<T> {
    const pickItems = items.map((item, index) => ({
        label: `item${index+1}`,
        data: item,
    } as unknown as DataQuickPickItem<T>))

    return createQuickPick(pickItems)
}

function createTestInputPrompter(): Prompter<string> {
    return createInputBox()
}

//function keys<T>(): Array<keyof T> {s
//    return []
//}

class TestWizard extends Wizard<TestWizardForm> {
    constructor() {
        super(initializeInterface<TestWizardForm>())

        this.form.prop1.bindPrompter(form => createTestPrompter('first', 'second'))
        this.form.prop2.bindPrompter(form => createTestPrompter(1, 2, 3))
        this.form.prop3.bindPrompter(form => createTestPrompter(
            { prop1: 'abc', prop2: 'def'}, { prop1: 'ghi', prop2: 'jkl' }
        ))
        
        this.form.nestedProp1.prop1.bindPrompter(form => createTestPrompter('nest1'))
        this.form.nestedProp1.prop2.bindPrompter(form => createTestPrompter(true, true, false)) // random booleans

        this.form.nestedProp2.prop1.bindPrompter(form => createTestInputPrompter())
        this.form.nestedProp2.prop2.bindPrompter(form => createTestPrompter(4, 5, 6).setCustomInput(v => Number(v)))
    }

    public async run(): Promise<TestWizardForm | undefined> {
        return await super.run()
    }
}

describe('WizardFramework', async function () {
    it('Basic test', async function() {
        const wizard = new TestWizard()
        const commands: WizardCommand[] = [
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item2'],
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item3'],
            [WizardCommandType.INPUTBOX, 'hello'],
            [WizardCommandType.QUICKPICK, 'item2'],
        ]
        const tester = new WizardTester(wizard, commands)
        const out = await tester.run()
        assert.ok(out !== undefined)
        assert.strictEqual(out.prop1, 'first')
        assert.ok(out.prop2 === 1)
        assert.strictEqual(out.prop3.prop1,'ghi')
        assert.ok(out.prop3.prop2 === 'jkl')
        assert.ok(out.nestedProp1.prop1 === 'nest1')
        assert.strictEqual(out.nestedProp1.prop2, false)
    })

    it('Basic test 2', async function() {
        const wizard = new TestWizard()
        const commands: WizardCommand[] = [
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item2'],
            [WizardCommandType.QUICKPICK, 'item1'],
            [WizardCommandType.QUICKPICK, 'item3'],
            [WizardCommandType.INPUTBOX, 'hello'],
            [WizardCommandType.QUICKPICK, 'item2'],
        ]
        const tester = new WizardTester(wizard, commands)
        const out = await tester.run()
        assert.ok(out !== undefined)
        assert.strictEqual(out.prop1, 'first')
        assert.ok(out.prop2 === 1)
        assert.strictEqual(out.prop3.prop1,'ghi')
        assert.ok(out.prop3.prop2 === 'jkl')
        assert.ok(out.nestedProp1.prop1 === 'nest1')
        assert.strictEqual(out.nestedProp1.prop2, false)
        assert.strictEqual(out.nestedProp2.prop1, 'hello')
        assert.strictEqual(out.nestedProp2.prop2, 5)
    })
})