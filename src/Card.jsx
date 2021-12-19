const Card = (props) => {
  return (
    <div className="border my-2">
      <div className="border border-purple-400 rounded-md p-2">
        <div className="font-mono py-2">{props.name}</div>
        <div className="border border-t-purple-500 border-x-0 border-b-0 text-sm pt-1">
          uuid: {props.uuid}
        </div>
      </div>
    </div>
  );
};

export default Card;
