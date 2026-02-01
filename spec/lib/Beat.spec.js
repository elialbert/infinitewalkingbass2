import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';
import Bar from 'src/lib/Bar.js';
import Beat from 'src/lib/Beat.js';

it('has a note', () => {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.99;
  global.Math = mockMath;
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  const l = new Line(s, 0)
  const b = new Bar(l, 'Cmaj7', 0)
  const beat = new Beat(b, 0)
  beat.generate('C')
  expect(beat.note).toEqual('C')
  expect(beat.gather()).toEqual(['C'])
})