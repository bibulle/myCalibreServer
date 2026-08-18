import { cleanAccent, matchesSearch } from './search-util';

describe('search-util', () => {
  describe('cleanAccent', () => {
    it('should lowercase the string', () => {
      expect(cleanAccent('Clamser À Tataouine')).toBe('clamser a tataouine');
    });

    it('should replace accented characters', () => {
      expect(cleanAccent('àâáäèéêëïìôöùûü')).toBe('aaaaeeeeiioouuu');
    });

    it('should replace î, ç and the other characters the old hand-written list missed', () => {
      expect(cleanAccent('île français señor L’haÿ Nº')).toBe('ile francais senor l’hay no');
    });

    it('should replace ligatures and ø', () => {
      expect(cleanAccent('Æneid Œuvre Møre')).toBe('aeneid oeuvre more');
    });
  });

  describe('matchesSearch', () => {
    const title = 'Clamser à Tataouine';

    it('should match an empty search', () => {
      expect(matchesSearch(title, '')).toBe(true);
    });

    it('should match a blank search', () => {
      expect(matchesSearch(title, '   ')).toBe(true);
    });

    it('should match the full title', () => {
      expect(matchesSearch(title, 'clamser à tataouine')).toBe(true);
    });

    it('should match every word independently of the order (issue #241)', () => {
      expect(matchesSearch(title, 'clamser tataouine')).toBe(true);
      expect(matchesSearch(title, 'tataouine clamser')).toBe(true);
    });

    it('should ignore extra spaces between the words', () => {
      expect(matchesSearch(title, '  clamser   tataouine ')).toBe(true);
    });

    it('should be accent and case insensitive', () => {
      expect(matchesSearch(title, 'TATAOUINE')).toBe(true);
      expect(matchesSearch(title, 'clamser a tataouïne')).toBe(true);
    });

    it('should not match when one of the words is missing', () => {
      expect(matchesSearch(title, 'clamser ailleurs')).toBe(false);
    });

    it('should not match a totally different search', () => {
      expect(matchesSearch(title, 'germinal')).toBe(false);
    });

    it('should still match partial words (substring per word)', () => {
      expect(matchesSearch(title, 'clam tata')).toBe(true);
    });

    it('should match titles containing î or ç with an unaccented search', () => {
      expect(matchesSearch("L'Île mystérieuse", 'ile mysterieuse')).toBe(true);
      expect(matchesSearch('Le Français', 'francais')).toBe(true);
    });

    it('should match an accented search against an unaccented title', () => {
      expect(matchesSearch('Ile mysterieuse', 'île mystérieuse')).toBe(true);
    });
  });
});
