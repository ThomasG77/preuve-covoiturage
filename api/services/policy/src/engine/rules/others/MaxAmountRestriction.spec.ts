// import chai from 'chai';
// import chaiAsync from 'chai-as-promised';
// import { MaxAmountRestriction } from './MaxAmountRestriction';
// import { compose } from '../../helpers/compose';
// import { NotApplicableTargetException } from '../../exceptions/NotApplicableTargetException';
// import { MetadataWrapper } from '../../MetadataWrapper';
// import { faker } from '../../helpers/faker';

// const meta = new MetadataWrapper(1, 'default', {});

// chai.use(chaiAsync);
// const { expect } = chai;

// const apply = compose([
//   new MaxAmountRestriction({
//     amount: 10,
//     period: 'month',
//   }).apply,
//   async (ctx): Promise<void> => {
//     ctx.result = 10;
//   },
// ]);

// const trip = faker.trip([{}]);

// describe('Policy rule: max amout', () => {
//   it('should increase meta data', async () => {
//     const data = {
//       result: 0,
//       person: trip.people[0],
//       trip,
//       meta,
//     };
//     await apply(data, async () => {});
//     const datetime = trip.people[0].datetime;
//     const [month, year] = [datetime.getMonth(), datetime.getFullYear()];
//     expect(meta.get(`${MaxAmountRestriction.slug}.month.${month}-${year}`, null)).to.eq(10);
//   });

//   it('should raise error if limit is reached', () => {
//     const data = {
//       result: 0,
//       person: trip.people[0],
//       trip,
//       meta,
//     };
//     return expect(apply(data)).to.eventually.rejectedWith(
//       NotApplicableTargetException,
//       MaxAmountRestriction.description,
//     );
//   });
// });
