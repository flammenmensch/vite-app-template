import { visualTest } from '#test/visual'
import * as stories from './Header.stories'

visualTest('default', stories.Default)
visualTest('with custom class', stories.WithCustomClass)
