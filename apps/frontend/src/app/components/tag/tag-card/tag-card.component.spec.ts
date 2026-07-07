import { Tag } from '@my-calibre-server/api-interfaces';
import { TagCardComponent } from './tag-card.component';

describe('TagCardComponent', () => {
  let component: TagCardComponent;

  function makeTag(overrides: Partial<Tag> = {}): Tag {
    return { ...new Tag(), tag_id: 1, tag_name: 'Sci-Fi', books: [{} as never, {} as never], ...overrides };
  }

  beforeEach(() => {
    component = new TagCardComponent();
  });

  it('should be created with default inputs', () => {
    expect(component).toBeTruthy();
    expect(component.active).toBe(false);
    expect(component.weight).toBe(500);
    expect(component.fontSize).toBe('13px');
  });

  describe('selected', () => {
    it('should emit when triggered', () => {
      const spy = jest.fn();
      component.selected.subscribe(spy);

      component.selected.emit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('tag input', () => {
    it('should accept a tag with its books', () => {
      component.tag = makeTag();
      expect(component.tag.tag_name).toBe('Sci-Fi');
      expect(component.tag.books).toHaveLength(2);
    });
  });
});
